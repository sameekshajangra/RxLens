const fs = require('fs');

let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Telemetry and Chat trigger for Comprehension Check
const oldComprehensionNo = `onClick={() => setComprehensionStatus('no')}`;
const newComprehensionNo = `onClick={() => {
                              setComprehensionStatus('no');
                              console.log("[TELEMETRY] Comprehension Check: NO", { timestamp: new Date().toISOString(), result: result?.data?.drug });
                              
                              // Trigger Chat
                              setShowChat(true);
                              setTimeout(() => {
                                const question = language === 'Hindi' 
                                  ? "मुझे यह समझ नहीं आया कि यह दवा कब लेनी है। कृपया बहुत सरल शब्दों में फिर से समझाएं।"
                                  : "I didn't understand when to take this medicine. Please explain it to me very simply.";
                                setChatMessage(question);
                                // The send will need to be triggered manually or we can directly bypass it by simulating
                              }, 100);
                            }}`;
appContent = appContent.replace(oldComprehensionNo, newComprehensionNo);

const oldComprehensionYes = `onClick={() => setComprehensionStatus('yes')}`;
const newComprehensionYes = `onClick={() => {
                              setComprehensionStatus('yes');
                              console.log("[TELEMETRY] Comprehension Check: YES", { timestamp: new Date().toISOString(), result: result?.data?.drug });
                            }}`;
appContent = appContent.replace(oldComprehensionYes, newComprehensionYes);

// 2. Fix Chat Assistant button at 1221
appContent = appContent.replace(
  '<MessageCircle size={16} /> Chat Assistant',
  '<MessageCircle size={16} /> {t.chat_assistant || "Chat Assistant"}'
);

// 3. Make chat send via function call directly if possible, but state setting is enough if the user hits send. Let's make it auto-send.
// It's tricky to auto send without passing `chatMessage` to `handleChatSend` as an arg.
// Let's modify handleChatSend to take an optional parameter.
appContent = appContent.replace(
  `const handleChatSend = useCallback(async () => {\n    if (!chatMessage.trim()) return;\n    const userMsg = chatMessage;`,
  `const handleChatSend = useCallback(async (overrideMsg = null) => {\n    const msgToSend = overrideMsg || chatMessage;\n    if (!msgToSend.trim()) return;\n    const userMsg = msgToSend;`
);

// Update the Comprehension No to auto send
const autoSendComprehension = `onClick={() => {
                              setComprehensionStatus('no');
                              console.log("[TELEMETRY] Comprehension Check: NO", { timestamp: new Date().toISOString(), result: result?.data?.drug });
                              
                              setShowChat(true);
                              const question = language === 'Hindi' 
                                ? "मुझे यह समझ नहीं आया कि यह दवा कब लेनी है। कृपया बहुत सरल शब्दों में फिर से समझाएं।"
                                : "I didn't understand when to take this medicine. Please explain it to me very simply.";
                              handleChatSend(question);
                            }}`;
appContent = appContent.replace(newComprehensionNo, autoSendComprehension);

fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Updated App.jsx with telemetry and auto chat");
