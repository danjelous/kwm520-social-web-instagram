// --------------------------------------------------------------------------------------------------------
// Zwischenablage
// https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395236
// https://azure.microsoft.com/en-us/try/cognitive-services/my-apis/
// --------------------------------------------------------------------------------------------------------

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
    template: '<div class="picture"><img src="{{image}}" onclick="analyzeImg(\'{{image}}\',\'{{caption}}\',\'{{comments}}\',\'{{likes}}\');" /></div>',
    //template: '<div class="item"><h2 style="margin-top: 30px">{{caption}}</h2><a href="{{link}}"><img src="{{image}}" /></a><a href="{{image}}" target="_blank" style="display: block;">Image source: {{image}}</a><hr></div>',
    resolution: 'low_resolution'
});
feed.run();

// Falls gerade gesprochen wird kann man ja ned gleichzeitig reden, also gibts ne rednerliste
var rednerliste = '';

// hier zusammenbauen
function starteRednerliste(rede) {
    rednerliste = rednerliste + ' ' + rede;
}

// Funktion um Daten an Microsoft zu schicken nachdem Bild geklickt wurde
function analyzeImg(pictureLink, caption, comments, likes) {
    // initial voice output from instagram
    if (caption) starteRednerliste('The caption of the picture is ' + caption + '.');
    if (comments > 0) starteRednerliste('There are ' + comments + ' comments.');
    if (likes > 0) starteRednerliste('There are ' + likes + ' likes.');

    // Und ab geht die Post zur face+emotion detection
    var q1 = sendToMicrosoftVision(pictureLink);
    var q2 = sendToMicrosoftFace(pictureLink);

    // wenn die Herren fertig sind, dann starte die rednerliste
    $.when(q1, q2).then(function (result) {
        responsiveVoice.speak(rednerliste);
        rednerliste = '';
    });
}

// Audio Output VisionData
function audioOutputVision(data) {
    if (data != null) {
        // TODO for Dani
        // Hier aus dem data object (output von microsoft) einen Satz bilden, und den an die starteRednerliste schicken
        //starteRednerliste('Here is the english output sentence for Microsoft Vision API Object Response');

        // Example
        var keywordliste = '';
        for (var i = 0; i < data.tags.length; i++) {
            keywordliste = keywordliste + data.tags[i].name + '. ';
            if (i == 5) break;
        }
        if (keywordliste) starteRednerliste('The Picture can be described by keywords like: ' + keywordliste);
    }
}

// Audio Output FaceData
function audioOutputFace(data) {
    if (data.length > 0) {
        // TODO for Dani
        // Hier aus dem data object (output von microsoft) einen Satz bilden, und den an die starteRednerliste schicken
        // starteRednerliste('Here is the english output sentence for Microsoft Face API Object Response');

        //Example
        switch (data.length > 1) {
            case true:
                starteRednerliste('There are ' + data.length + ' people visible on this picture.');
                break;
            case false:
                starteRednerliste('There is 1 person visible on this picture.');
                break;
            default:
                break;
        }

        for (var i = 0; i < data.length; i++) {
            starteRednerliste('Person ' + (i + 1) + ' is probably ' + Math.round(data[i].faceAttributes.age) + ' years old.');
        }
    }
}

// Vision API
// Send to Microsoft API
function sendToMicrosoftVision(pictureLink) {
    return $.ajax({
        url: "https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Categories,Tags,Description,Faces,ImageType,Color,Adult",
        beforeSend: function (xhrObj) {
            // Request headers
            xhrObj.setRequestHeader("Content-Type", "application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "1e040e58d4294bc6b6b075816d863a13");
        },
        type: "POST",
        crossDomain: true,
        processData: false,
        data: '{ "url": "' + pictureLink + '" }'
    })
        .done(function (data) {
            console.log("##### WEBREQUEST SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputVision(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST FAILED : Output: #####");
            console.log(textStatus);
        });
}

// Face API
// Send to Microsoft API
function sendToMicrosoftFace(pictureLink) {
    return
    $.ajax({
        url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure",
        beforeSend: function (xhrObj) {
            // Request headers
            xhrObj.setRequestHeader("Content-Type", "application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "dc73d0ae908646e4b863b2ca0f329ef5");
        },
        type: "POST",
        crossDomain: true,
        processData: false,
        data: '{ "url": "' + pictureLink + '" }'
    })
        .done(function (data) {
            console.log("##### WEBREQUEST SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputFace(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST FAILED : Output: #####");
            console.log(textStatus);
        });
}
