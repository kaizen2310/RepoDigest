# implement drag and drop
# implement hybrid RAG
# implementing smart chunking 
option1 : implement hardcoded 500 token chunk splitting with file path 
option2 : overlapping chuck splitting to retrive information efficiently

if we ask question and its answer is split between 2 chunks then it will retrive information about question from thhe chunck which is 
more similar to it using cosine similarity. but its half information and that a big error//issue

so to avoid this we can use overlapping chunks,so after implementing this then the retrival part information will come from both the chucks as they are overlapping so this 2 chucks will have high cosine similarity with user entered query embedding


The two-stage pipeline is correct:
Ingest → chunk → embed → store in MongoDB Atlas
Query → embed question → vector search → build prompt → stream answer


#setup user profile and give each user in repo ingestion request option only
if he want more pay
this is to avoid rate limit


can use grok api its also free for querying and gemini for embedding


add somthing which will create visual map for codebase 

add all types of files used in that repo not just one


add timer for embedding to complete menter so user can know how much wait 

create sepearate file explaining nice important useful featuer or caution you have implemented to take care of user need need

if someone has already index a file i should be used to again index


check files included in digest generation and embedding generation and to igonre file like test while embedding

M

ost users first want:

What is this project?

Consider an AI-generated overview card:



give user warning about incorrect answer that all answer are based of repo text/context



when user paste link show user what stage is at like fecctching from github generating digest and all that so user knows something is happening 