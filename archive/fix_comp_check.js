const fs = require('fs');
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetHTML = `                        <MessageCircle size={16} /> {t.chat_assistant || "Chat Assistant"}
                      </button>
                    </div>
                  </div>
                </motion.div>`;
                
const replacementHTML = `                        <MessageCircle size={16} /> {t.chat_assistant || "Chat Assistant"}
                      </button>
                    </div>
                  </div>
                  
                  {userMode === 'patient' && (
                    <ComprehensionCheck t={t} onReview={() => {
                      setShowChat(true);
                      setExplanationLevel('simple');
                      const question = language === 'Hindi' 
                        ? "मुझे यह समझ नहीं आया कि यह दवा कब लेनी है। कृपया बहुत सरल शब्दों में फिर से समझाएं।"
                        : "I didn't understand when to take this medicine. Please explain it to me very simply.";
                      setChatMessage(question);
                      setTimeout(() => handleChatSend(question), 500);
                    }} />
                  )}
                  
                </motion.div>`;
                
appContent = appContent.replace(targetHTML, replacementHTML);
fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Injected ComprehensionCheck into render tree.");
