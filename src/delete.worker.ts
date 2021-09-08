import { parentPort, threadId } from "worker_threads";
import rimraf = require("rimraf");

parentPort?.on('message', (pathsToDelete: string[]) =>
{
	for (const pathToDelete of pathsToDelete)
	{
		rimraf(pathToDelete, (err) =>
		{
			if (err)
			{
				console.error(`[Worker ${threadId}] Failed to delete ${pathToDelete}`);
				parentPort?.postMessage(false);
			}

			console.log(`[Worker ${threadId}] Deleted ${pathToDelete}`);
			parentPort?.postMessage(true);
		})
	}
})