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

    // Initial voice output from instagram
    if (caption || comments || likes) {
        starteRednerliste('This picture has following data on instagram:');
    }
    if (caption) {
        starteRednerliste('The caption of this picture is ' + caption + '.');

        if (comments || likes) {
            starteRednerliste('It has ' + comments + 'comments and ' + likes + ' likes.');
        }
    } else {
        if (comments || likes) {
            if (likes == 1) {
                starteRednerliste('It has no caption, ' + comments + 'comments and ' + likes + ' like.');
            } else {
                starteRednerliste('It has no caption, ' + comments + 'comments and ' + likes + ' likes.');
            }
        }
    }

    // Und ab geht die Post zur face+emotion detection
    //var q1 = sendToMicrosoftVision(pictureLink);
    var q2 = sendToMicrosoftFace(pictureLink);

    // wenn die Herren fertig sind, dann starte die rednerliste
    // $.when(q1, q2).then(function (result) {
    $.when(q2).then(function (result) {
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

        // Build String of the image description which gets spoken via the text2speech API
        starteRednerliste(getFaceDescriptionStringFromData(data));
    } else {
        // No person
        starteRednerliste('There are no persons in this picture.');
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
            console.log("##### WEBREQUEST VISION SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputVision(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST VISION FAILED : Output: #####");
            console.log(textStatus);
        });
}

// Face API
// Send to Microsoft API
function sendToMicrosoftFace(pictureLink) {
    return $.ajax({
        url: "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure",
        beforeSend: function (xhrObj) {
            // Request headers
            xhrObj.setRequestHeader("Content-Type", "application/json");
            //xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "dc73d0ae908646e4b863b2ca0f329ef5");
        },
        type: "POST",
        crossDomain: true,
        processData: false,
        data: '{ "url": "' + pictureLink + '" }'
    })
        .done(function (data) {
            console.log("##### WEBREQUEST FACE SUCCESS: RESPONSE: #####");
            console.log(data);
            audioOutputFace(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("##### WEBREQUEST FACE FAILED : Output: #####");
            console.log(textStatus);
        });
}

// Return the most propable emotion
function getHighestValueFromObject(obj) {
    var key = Object.keys(obj).reduce(function (a, b) { return obj[a] > obj[b] ? a : b });
    return key.toString() + ';' + Math.floor(obj[key] * 100);
}

// Retuns string from data obj
function getFaceDescriptionStringFromData(data) {

    var speechString = '';
    var numOfPeople = data.length;
    var isSinglePerson;
    if (numOfPeople === 1) {
        speechString += 'There is one ' + data[0].faceAttributes.gender + ' person visible in this picture. ';
        isSinglePerson = true;
    } else {
        speechString += 'There are ' + numOfPeople + ' persons visible in this picture. ';
        isSinglePerson = false;
    }

    for (var i = 0; i < data.length; i++) {

        console.log(data[i]);
        var fa = data[i].faceAttributes;
        var gender = fa.gender;

        // Gender
        if (isSinglePerson) {
            (gender == 'male') ? speechString += 'He is' : speechString += 'She is';
        } else {
            speechString += 'Person ' + (i + 1) + ' is ' + gender + ',';
        }

        // Age, glasses
        speechString += ' propably ' + Math.round(fa.age) + ' years old and wears ';
        (fa.glasses === 'NoGlasses') ? speechString += 'no glasses.' : speechString += fa.glasses + '. ';

        // Hair
        (gender == 'male') ? speechString += 'He' : speechString += 'She';
        if (fa.hair.bald > 0.8) {
            speechString += ' is bald';
        } else {
            speechString += ' has ' + fa.hair.hairColor[i].color + ' hair';
        }

        // Beard
        if(gender == 'male') {
            speechString += ' and has a beard-level of ' + fa.facialHair.beard * 100 + ' percent. ';
        } else {
            speechString += '. ';
        }

        // Emotion
        var emotion = getHighestValueFromObject(fa.emotion);
        speechString += 'The person\'s most expressed emotion is ' + emotion.split(';')[0] + '.';
    }

    return speechString;
}