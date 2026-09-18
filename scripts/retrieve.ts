import { questionFromArgs, run } from "./common";
import { retrieve } from "../lib/rag/retrieve";

run(async () => {
  const documents = await retrieve(questionFromArgs());
  console.log(JSON.stringify({ retrievedCount: documents.length, documents }, null, 2));
});
