import { Worker } from 'worker_threads';
import { readdirSync } from "fs";
import path from "path";

const MAX_THREADS = 8;
const FOLDER_NAME_TO_DELETE = 'node_modules';

let rootFolder = process.argv[2] ?? __dirname;

let foldersToDelete: string[] = [];

/**
 * Recursively searches a directory for folders to delete and appends them to
 * `foldersToDelete` array
 * @param dir Directory to search
 */
function findFoldersToDelete(dir: string)
{
	let filesInCurrentDir = readdirSync(dir, { withFileTypes: true });

	for (let file of filesInCurrentDir)
	{
		if (file.isDirectory())
		{
			if (file.name === FOLDER_NAME_TO_DELETE)
			{
				foldersToDelete.push(path.join(dir, file.name));
			}
			else
			{
				findFoldersToDelete(path.join(dir, file.name));
			}
		}
	}
}

// Start the recursive function with the current directory
findFoldersToDelete(rootFolder);

console.log(`Found ${foldersToDelete.length} folders to delete`);

// Compute Tasks for Workers
let workerTasks: { folders: string[] }[] = [];

for (let i = 0; i < foldersToDelete.length; i++)
{
	const folderName = foldersToDelete[i];
	let workerIndex = i % MAX_THREADS;

	if (workerTasks[workerIndex]?.folders)
	{
		workerTasks[workerIndex].folders.push(folderName)
	} else
	{
		workerTasks[workerIndex] = {
			folders: [folderName],
		}
	}
}

let successCount = 0;
let failureCount = 0;
let processedCount = 0;
let totalCount = foldersToDelete.length;

// Create Worker with task
for (let worker of workerTasks)
{
	const childWorker = new Worker(__dirname + '/delete.worker.js');

	childWorker.on('message', (status: boolean) =>
	{
		status ? successCount++ : failureCount++;
		processedCount++;

		if (processedCount === totalCount)
		{
			console.table({
				'Total Count': totalCount,
				'Success Count': successCount,
				'Failure Count': failureCount,
			})
			process.exit(0);
		}
	});

	childWorker.postMessage(worker.folders);
}



