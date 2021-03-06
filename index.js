const email = process.argv[2];
const password = process.argv[3];

console.log(email,password);

const got = require('got');
const download = require('download');
const moment = require('moment');

const authUrl = 'https://app.famly.co/api/login/login/authenticate';
const feedUrl = 'https://api.famly.co/api/feed/feed/feed';

const credentials = {
    email: email,
    password: password
};

let token;

let olderThan;

async function parseFeed() {
    // Setup query
    let searchParams = {
        accessToken: token
    };
    if (olderThan) {
        searchParams.olderThan = olderThan;
    }

    // Get feed
    const feed = JSON.parse((await got(feedUrl, {
        searchParams: searchParams
    })).body).feedItems;

    if (feed.length) {
        // Loop feed and find media
        for (const post of feed) {
            if (post.videos.length) {
                for (const video of post.videos) {
                    await download(video.videoUrl, 'videos/' + moment(post.createdDate).format('YYYY-MM-DD'));
                }
            }
            if (post.images.length) {
                for (const image of post.images) {
                    await download(image.url_big, 'images/' + moment(post.createdDate).format('YYYY-MM-DD'));
                }
            }
            olderThan = post.createdDate;
        }
        return true;
    } else {
        return false;
    }
}

async function famly() {
    console.log('Starting')

    // Authenticate and return token
    token = JSON.parse((await got.post(authUrl, {
        json: credentials
    })).body).accessToken;
    
    // Find images and videos in feed
    while (await parseFeed()) {
        console.log('Status:', moment(olderThan).format('YYYY-MM-DD'));
    }

    console.log('Done');
}

famly();