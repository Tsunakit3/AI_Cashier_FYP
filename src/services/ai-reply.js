export async function AIReply(userInput) {
  try {
    const resp = await fetch("http://localhost:9000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_message: userInput }),
    });
    return await resp.json();
  } catch (err) {
    console.error("Chat API error:", err);
    return { text: "⚠️ Server error, please try again." };
  }
}
