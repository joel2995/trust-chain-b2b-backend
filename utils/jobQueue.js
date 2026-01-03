const queue = [];
let isProcessing = false;

export const addJob = async (jobFn, data) => {
  queue.push({ jobFn, data });
  processQueue();
};

const processQueue = async () => {
  if (isProcessing) return;
  if (queue.length === 0) return;

  isProcessing = true;

  const { jobFn, data } = queue.shift();

  try {
    await jobFn(data);
  } catch (err) {
    console.error("❌ Job execution error:", err.message);
  } finally {
    isProcessing = false;
    processQueue(); // process next job
  }
};
