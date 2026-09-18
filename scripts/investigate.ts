import { questionFromArgs, run } from "./common";
import { investigate } from "../lib/workflows/investigate";

run(async () => { console.log(JSON.stringify(await investigate({ question: questionFromArgs() }), null, 2)); });
