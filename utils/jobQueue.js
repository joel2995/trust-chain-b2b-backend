let queue = [];
let isProcessing = false;

export const addJob = async (jobFn, data) => {
  queue.push({ jobFn, data });
  processQueue();
};

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { jobFn, data } = queue.shift();

  try {
    await jobFn(data);
  } finally {
    isProcessing = false;
    processQueue();
  }
};

// 👇 ADD THIS
export const getQueueStatus = () => ({
  pendingJobs: queue.length,
  processing: isProcessing,
});
