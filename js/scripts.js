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

function starteRednerliste (rede) {
    if(responsiveVoice.isPlaying()) {
        rednerliste = rednerliste + ' ' + rede;
        console.log('++ Rednerliste updatet, now: '+ rednerliste);
    }
    else {
        responsiveVoice.speak(rede + ' ' + rednerliste);
        rednerliste = '';
        console.log('++ Rednerliste gecleared');
    }
}

// Funktion um Daten an Microsoft zu schicken nachdem Bild geklickt wurde
function analyzeImg(pictureLink, caption, comments, likes) {
    // initial voice output, auch um ein wenig wartezeit zu überbrücken...
    if (caption) starteRednerliste('The caption of the picture is '+ caption);
    if (comments > 0) starteRednerliste('There are '+ comments + 'comments.');
    if (likes > 0) starteRednerliste('There are '+ likes + 'likes.');

    // Und ab geht die Post zur face+emotion detection
    sendToMicrosoftVision (pictureLink);
    sendToMicrosoftFace (pictureLink);

    // falls nu was auf der Rednerliste steht.
    starteRednerliste(' ');
}

// Audio Output VisionData
function audioOutputVision (data) {
    if (data != null) {
        starteRednerliste('I love javascript.');
    }
}

// Audio Output FaceData
function audioOutputFace (data) {
    if (data.length > 0) {
        starteRednerliste('I hate phyton.');
    }
}

// Vision API
// send to microsoft api

function sendToMicrosoftVision (pictureLink) {
    $.ajax({
            url: "https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Categories,Tags,Description,Faces,ImageType,Color,Adult",
            beforeSend: function (xhrObj) {
                // Request headers
                xhrObj.setRequestHeader("Content-Type","application/json");
                //xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "1e040e58d4294bc6b6b075816d863a13");
            },
            type: "POST",
            crossDomain: true,
            processData: false,
            //dataType: 'jsonp',
            // Request body
            //data: imgStream,
            data: '{ "url": "'+ pictureLink +'" }'
        })
        .done(function (data) {
            console.log("##### WEBREQUEST SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputVision(data);
            //$('#overlay').css('display','none');
            //draw(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST FAILED : Output: #####");
            console.log(textStatus);
            //$('#overlay').css('display','none');
        });
}

// Face API
// send to microsoft api

function sendToMicrosoftFace (pictureLink) {
    $.ajax({
            url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure",
            beforeSend: function (xhrObj) {
                // Request headers
                xhrObj.setRequestHeader("Content-Type","application/json");
                //xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "dc73d0ae908646e4b863b2ca0f329ef5");
            },
            type: "POST",
            crossDomain: true,
            processData: false,
            //dataType: 'jsonp',
            // Request body
            //data: imgStream,
            data: '{ "url": "'+ pictureLink +'" }'
        })
        .done(function (data) {
            console.log("##### WEBREQUEST SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputFace(data);
            //$('#overlay').css('display','none');
            //draw(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST FAILED : Output: #####");
            console.log(textStatus);
            //$('#overlay').css('display','none');
        });
}

//draw img @postion from response
function draw (data) {
    for (var i = 0; i<data.length; i++) {
        var face = $("<img>").attr('src', returnImgString(data[i])).attr('class', 'emoji').css(
            {
                "left": data[i].faceRectangle.left/scaleFactor(),
                "top": data[i].faceRectangle.top/scaleFactor(),
                "width" : data[i].faceRectangle.width/scaleFactor()
            });
        $('#result').append(face);
        console.log ("scale = " + scaleFactor())
    }
}

//return Img String to use
function returnImgString (person) {
    return 'img/'+returnEmotion(person.scores)+'.png';
}

//return closest emotion value
function returnEmotion (scores) {
    var max = Math.max.apply(null,Object.keys(scores).map(function(x){ return scores[x] }));
    var emotion = Object.keys(scores).filter(function(x){ return scores[x] == max; })[0];
    return emotion;
}