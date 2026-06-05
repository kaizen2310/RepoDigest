flowchart TD
  %% =========================
  %% RepoDigest Backend Architecture
  %% =========================

  Client[Frontend / API Client<br/>localhost:5173]
  Server[Express Server<br/>backend/server.js<br/>Port 5000]
  Mongo[(MongoDB / Mongoose)]
  GitHub[GitHub API<br/>Octokit]
  Gemini[Google Gemini API<br/>@google/genai]
  AtlasVector[MongoDB Atlas Vector Search<br/>$vectorSearch index: vector_index]

  Client -->|HTTP JSON| Server

  Server -->|CORS localhost:5173| Middleware[CORS + express.json]
  Middleware --> Health[GET /api/health]
  Middleware --> DigestRoutes[/api/digest routes]
  Middleware --> ChatRoutes[/api/chat routes]

  Server -->|connect process.env.MONGO_URI| Mongo

  %% =========================
  %% Digest Routes
  %% =========================

  DigestRoutes --> TreeRoute[POST /api/digest/tree]
  DigestRoutes --> GenerateRoute[POST /api/digest/generate]
  DigestRoutes --> GetDigestRoute[GET /api/digest/:id]

  TreeRoute --> GetRepoTree[getRepoTree controller]
  GetRepoTree --> ParseUrl[parseGithubUrl]
  ParseUrl --> FetchTree[fetchRepoTree]
  ParseUrl --> FetchMeta1[fetchRepoMeta]
  FetchTree --> GitHub
  FetchMeta1 --> GitHub
  GetRepoTree -->|returns owner, repo, ref, files, meta| Client

  GenerateRoute --> GenerateController[generateRepoDigest controller]

  GenerateController --> ValidateGenerate[Validate owner, repo, ref, files]
  ValidateGenerate --> CacheLookup[Find cached Digest<br/>owner + repo + ref<br/>created within 1 hour]
  CacheLookup --> Mongo

  CacheLookup -->|cached found| CachedDecision{Chunks exist or ingest failed?}
  CachedDecision -->|no reprocessing needed| ReturnCached[Return cached digest]
  ReturnCached --> Client

  CachedDecision -->|chunkCount = 0 or failed| RegenerateRaw[Regenerate raw files]
  RegenerateRaw --> GenerateDigestCached[generateDigest service]
  GenerateDigestCached --> FetchFileContentCached[fetchFileContent for each file]
  FetchFileContentCached --> GitHub
  RegenerateRaw --> BackgroundEmbedCached[Start background chunkAndEmbed]
  BackgroundEmbedCached -. fire and forget .-> ChunkAndEmbed

  CacheLookup -->|no cache| GenerateDigest[generateDigest service]
  GenerateDigest --> FetchFileContent[fetchFileContent batched by 10 files]
  FetchFileContent --> GitHub
  GenerateDigest --> BuildTree[buildDirectoryTree]
  GenerateDigest --> BuildDigestText[Build full text digest]
  GenerateDigest --> EstimateTokens[Estimate tokens by chars / 4]

  GenerateController --> FetchMeta2[fetchRepoMeta]
  FetchMeta2 --> GitHub

  GenerateController --> SaveDigest[Create Digest document<br/>ingestStatus: pending]
  SaveDigest --> Mongo

  GenerateController --> BackgroundEmbed[Start background chunkAndEmbed]
  BackgroundEmbed -. fire and forget .-> ChunkAndEmbed

  GenerateController -->|returns id, digest, tokenCount, fileCount, skipped, ingestStatus| Client

  GetDigestRoute --> GetDigestById[getDigestById controller]
  GetDigestById --> Mongo
  GetDigestById -->|returns Digest document| Client

  %% =========================
  %% Background Chunk + Embed Pipeline
  %% =========================

  ChunkAndEmbed[chunkAndEmbed background job]
  ChunkAndEmbed --> MarkProcessing[Set Digest ingestStatus = processing]
  MarkProcessing --> Mongo

  ChunkAndEmbed --> ChunkFiles[chunkFiles service]
  ChunkFiles --> SplitLines[Split each file by lines]
  SplitLines --> TokenChunks[Create ~500-token chunks<br/>with ~100-token overlap]
  TokenChunks --> EmbedChunks[embedChunks service]

  EmbedChunks --> BatchEmbeddings[Process chunks in batches of 5<br/>1 second delay between batches]
  BatchEmbeddings --> EmbedText[embedText]
  EmbedText --> GeminiEmbedding[Gemini embedding model<br/>gemini-embedding-001]
  GeminiEmbedding --> Gemini

  EmbedChunks --> InsertChunks[Insert Chunk documents<br/>text + filePath + line range + embedding]
  InsertChunks --> Mongo

  InsertChunks --> MarkReady[Set Digest ingestStatus = ready]
  MarkReady --> Mongo

  ChunkAndEmbed -->|on error| MarkFailed[Set Digest ingestStatus = failed<br/>store ingestError]
  MarkFailed --> Mongo

  %% =========================
  %% Chat / RAG Routes
  %% =========================

  ChatRoutes --> ChatRoute[POST /api/chat/:digestId]
  ChatRoute --> ChatController[chat controller]

  ChatController --> ValidateQuestion[Validate question]
  ChatController --> LoadDigest[Find Digest by digestId]
  LoadDigest --> Mongo

  ChatController --> CheckIngestStatus{ingestStatus?}
  CheckIngestStatus -->|pending / processing| Return202[Return 202<br/>repo still processing]
  Return202 --> Client

  CheckIngestStatus -->|failed| Return500[Return 500<br/>ingest failed]
  Return500 --> Client

  CheckIngestStatus -->|ready| CountChunks[Count chunks by digestId]
  CountChunks --> Mongo

  CountChunks -->|0 chunks| ReturnNoChunks[Return 202<br/>no chunks found]
  ReturnNoChunks --> Client

  CountChunks -->|chunks exist| SetupSSE[Set SSE headers<br/>text/event-stream]
  SetupSSE --> RAGQuery[ragQuery service]

  RAGQuery --> EmbedQuestion[Embed user question]
  EmbedQuestion --> GeminiEmbedding2[Gemini embedding model<br/>gemini-embedding-001]
  GeminiEmbedding2 --> Gemini

  RAGQuery --> VectorSearch[Mongo aggregation $vectorSearch<br/>filter owner, repo, ref]
  VectorSearch --> AtlasVector
  AtlasVector --> RelevantChunks[Top relevant chunks]

  RelevantChunks --> BuildPrompt[Build prompt with retrieved code context]
  BuildPrompt --> GenerateStream[Gemini chat stream<br/>gemini-1.5-flash]
  GenerateStream --> Gemini

  GenerateStream --> StreamChunks[Stream answer chunks over SSE]
  StreamChunks --> Client

  StreamChunks --> DoneEvent[Send done event]
  DoneEvent --> Client