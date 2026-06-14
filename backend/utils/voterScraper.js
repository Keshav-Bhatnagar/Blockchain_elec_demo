// Global map to hold mock states
const activeScraperSessions = new Map();

/**
 * Starts an epic verification session (MOCKED)
 */
async function startEpicVerificationSession(epicNumber, stateCode, sessionId) {
  // A small, transparent 1x1 PNG base64 string
  const mockCaptchaImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  // Store expected code and details
  activeScraperSessions.set(sessionId, {
    epicNumber,
    stateCode,
    expectedCaptcha: "VOTE26"
  });

  return mockCaptchaImage;
}

/**
 * Completes epic verification session (MOCKED)
 */
async function completeEpicVerification(sessionId, captchaUserInput) {
  const sessionData = activeScraperSessions.get(sessionId);
  if (!sessionData) {
    throw new Error(`No active session found for ID: ${sessionId}`);
  }

  if (captchaUserInput !== sessionData.expectedCaptcha) {
    throw new Error("Invalid CAPTCHA Code");
  }

  // Delete session to clean up
  activeScraperSessions.delete(sessionId);

  return {
    status: "Success",
    voterDetails: {
      epicNumber: sessionData.epicNumber || "DLT1234567",
      fullName: "Rajesh Kumar",
      relativeName: "Suresh Kumar",
      state: "Delhi",
      assemblyConstituency: "New Delhi - AC 40",
      pollingStation: "Government Model School, Sector 4"
    }
  };
}

export {
  activeScraperSessions,
  startEpicVerificationSession,
  completeEpicVerification
};
