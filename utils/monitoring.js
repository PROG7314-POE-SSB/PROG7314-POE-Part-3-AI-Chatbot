/**
 * Contains lightweight, reliable utility functions for server monitoring.
 */

/**
 * Calculates and formats the current memory usage of the Node.js process.
 * This is 100% reliable as it uses the built-in process.memoryUsage().
 *
 * @returns {Object} An object containing memory stats in MB.
 */
export function getMemoryStats() {
  const memUsage = process.memoryUsage();
  return {
    rss: Math.round(memUsage.rss / 1024 / 1024), // Resident Set Size in MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // Heap used in MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // Total heap in MB
  };
}

/**
 * Calculates a human-readable uptime string.
 * This is 100% reliable as it's simple date math.
 *
 * @param {Date} serverStartTime - The Date object of when the server started.
 * @returns {string} A human-readable uptime string (e.g., "3h 15m 10s").
 */
export function getUptimeFormatted(serverStartTime) {
  const uptimeMs = Date.now() - serverStartTime.getTime();
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);

  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
