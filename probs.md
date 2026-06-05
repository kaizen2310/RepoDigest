1.digest output and chat contect input isssue a
2.allignment iuse
3. removed seletec file download issue

4. improve ui and colours

commit 746c04e519a434f2c31ffdc3df7cdd8950fb0933 (HEAD -> main, origin/main, origin/HEAD)
Author: Shreeparth Torawane <181150650+kaizen2310@users.noreply.github.com>
Date:   Sun May 17 15:04:27 2026 +0530

    feat: enhance UI with new components and improve digest handling and removed selected file digest generation

commit 3ccfa4b2bc198654b182270adab9cfd825d769b6
Author: Shreeparth Torawane <181150650+kaizen2310@users.noreply.github.com>
Date:   Sun May 17 00:11:17 2026 +0530

    feat: add CORS support and update dependencies
:

important stable commits q


5th problem faced was when user uploads a digest on chatbot due to high token context of attched txt file it instantly hit rate limit 
this thing happen because when user enter new query it goes through entire attched context and burns the tokens to retrive information

thats why we are implementing rag


Right now, your app aggregates up to 300,000 tokens of raw repository text into a single frontend view and text file. While this is great for raw data extraction, dumping massive context into an LLM is expensive, slow, and prone to the "lost in the middle" phenomenon


i have to efficiently create digest because due line wastage and  high no lines model can lead to hallucinte