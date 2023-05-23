// Initialize Line Messaging API SDK with your Channel Access Token
const line = require('@line/bot-sdk');
const lineClient = new line.Client({
  channelAccessToken: 'YOUR_ACCESS_Token',
});

// Handle Line webhook events
function handleLineWebhookEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const messageText = event.message.text;

    // Check for specific commands or keywords
    if (messageText === 'import schedule') {
      // Send a message to the user to prompt them to access the import schedule function
      const replyMessage = {
        type: 'text',
        text: 'To import your schedule, please click the Import Schedule button in the extension.',
      };
      lineClient.replyMessage(event.replyToken, replyMessage);
    } else if (messageText === 'go to website') {
      // Send a message to the user to prompt them to go to the cof.ntpu.edu.tw website
      const replyMessage = {
        type: 'text',
        text: 'To access the website, please click the Go to Website button in the extension.',
      };
      lineClient.replyMessage(event.replyToken, replyMessage);
    } else {
      // Send a generic reply if the user sends an unsupported command
      const replyMessage = {
        type: 'text',
        text: 'Sorry, I don\'t understand that command.',
      };
      lineClient.replyMessage(event.replyToken, replyMessage);
    }
  }
}

// Set up webhook endpoint for Line
// This endpoint should be configured in the Line Developers Console
// to receive webhook events from the chat bot
app.post('/webhook/line', (req, res) => {
  const events = req.body.events;
  events.forEach((event) => {
    handleLineWebhookEvent(event);
  });
  res.sendStatus(200);
});
