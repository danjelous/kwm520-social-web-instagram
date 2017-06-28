// Get userID from username:
// https://www.instagram.com/{username}/?__a=1

// clientId: '6bcdfd39d6f144f28175fc3ffdf61468'
// access_token: 5663183675.6bcdfd3.4faacb05423041ea9e2a80e4c873b867
// redirect: https://www.fh-ooe.at
// code (auth): 2935809a1df74a118d205f488c74e4c8

// NO DATA :0
// https://stackoverflow.com/questions/33776342/instagram-sandboxed-app-request-with-public-content-scope-returns-empty-result

var feed = new Instafeed({
    get: 'user',
    userId: '5663183675',
    accessToken: '5663183675.6bcdfd3.4faacb05423041ea9e2a80e4c873b867',
    template: '<h2 style="margin-top: 30px">{{caption}}</h2><a href="{{link}}"><img src="{{image}}" /></a><a href="{{image}}" target="_blank" style="display: block;">Image source: {{image}}</a><hr>',
    resolution: 'low_resolution'
});
feed.run();