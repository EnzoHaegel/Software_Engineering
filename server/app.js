const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const OAuth2Data = require('./client_secret_332990903033-uil786vg2fm29le166gsbksb5pgq4qa1.apps.googleusercontent.com.json');

const app = express();

app.use(bodyParser.json());

const CLIENT_ID = OAuth2Data.installed.client_id;
const CLIENT_SECRET = OAuth2Data.installed.client_secret;
const REDIRECT_URL = 'http://127.0.0.1:3000/auth/google/callback'

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

let authed = false;

// Generate URL to auth endpoint
app.get('/', (req, res) => {
    if (!authed) {
        // Generate auth url
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/calendar'
        });
        console.log(url);
        res.redirect(url);
    } else {
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        // Your logic here to add events to the calendar
    }
});

// Get auth code from redirect url
app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our auth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                console.log(tokens);
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/');
            }
        });
    }
});

const port = 3000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
