### [Alexa skill library: audio-player-http-request-headers](https://github.com/warren-bank/Alexa-skill-libraries/tree/master/audio-player-http-request-headers)

Add API methods missing from Alexa ResponseBuilder to configure HTTP headers to include in requests for audio stream URLs

#### Install:

```bash
npm install --save "@warren-bank/alexa-skill-library-audio-player-http-request-headers"
```

#### Usage:

```js
const {AddAudioPlayerHttpHeadersRequestInterceptor, SetDefaultAudioPlayerHttpHeadersRequestInterceptor} = require('@warren-bank/alexa-skill-library-audio-player-http-request-headers')

const PlayAudioIntentHandler = {
  canHandle(handlerInput) {
    return (
      (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest') &&
      (
        (Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayAudioIntent') ||
        (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent')
      )
    );
  },
  handle(handlerInput) {
    const speakOutput    = 'Playing the audio stream.';
    const playBehavior   = 'REPLACE_ALL';

    // https://requestbin.com/
    // https://requestbin.com/r
    // https://requestbin.com/r/en0m33feca4osq
    const audioStreamUrl = 'https://en0m33feca4osq.x.pipedream.net/audio_track.mp3';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addAudioPlayerPlayDirective(
        playBehavior,
        audioStreamUrl,
        'mytoken',
        0
      )
  //  .removeAudioPlayerHttpHeaders()
      .addAudioPlayerHttpHeaders([{
        "name":  "X-Alexa-Issue",
        "value": "https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/issues/610#issuecomment-1483729767"
      }])
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    PlayAudioIntentHandler
  )
  .addRequestInterceptors(
    AddAudioPlayerHttpHeadersRequestInterceptor,
    SetDefaultAudioPlayerHttpHeadersRequestInterceptor([{
      "name":  "X-Alexa-Skill-Demo",
      "value": "https://github.com/warren-bank/Alexa-skill-demos/tree/alexa-samples/skill-sample-nodejs-audio-player/e93ec39"
    },{
      "name":  "X-Alexa-Skill-Library",
      "value": "https://github.com/warren-bank/Alexa-skill-libraries/tree/master/audio-player-http-request-headers"
    }])
  )
  .lambda();
```

#### Demo:

The code for the previous _usage_ example is taken from [this](https://github.com/warren-bank/Alexa-skill-demos/tree/alexa-samples/skill-sample-nodejs-audio-player/e93ec39) minimal but complete skill demo.

#### Issue this library solves:

* [this issue](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/issues/610) for the the official javascript library has been open for over 3 years
* [AudioPlayer v1.5](https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/audioplayer.html#play) added support for user-defined HTTP request headers
  - however, the javascript API hasn't been updated to expose this functionality
* a quick test of [my proposed workaround](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/issues/610#issuecomment-1483729767) proved it effective
  - the purpose for this library is to package this methodology into [`ResponseBuilder`](http://ask-sdk-node-typedoc.s3-website-us-east-1.amazonaws.com/classes/responsebuilder.html), so its usage is easy and follows the familiar pattern

#### API:

* `ResponseBuilder.addAudioPlayerHttpHeaders(headers_collections, only_update_last_directive)`
  - `headers_collections` can be:
    * an _Object_
      - having one or more of the following keys: ['key', 'manifest', 'audioSegment', 'all']
      - having an _Array_ of `{name, value}` _Objects_ for each key
    * an _Array_
      - of `{name, value}` _Objects_
      - which will be assigned to the key: 'all'
  - `only_update_last_directive` is:
    * a boolean
    * a truthy value indicates:
      - the provided headers should only be applied to the directive added by the most recent call to: `ResponseBuilder.addAudioPlayerPlayDirective(...)`
    * a non-truthy value indicates:
      - the provided headers should be applied to all directives added by previous calls to: `ResponseBuilder.addAudioPlayerPlayDirective(...)`

* `ResponseBuilder.removeAudioPlayerHttpHeaders(header_names, only_update_last_directive)`
  - `header_names` can be:
    * a _headers_collections Object_
      - having one or more of the following keys: ['key', 'manifest', 'audioSegment', 'all']
      - having any of the following non- _headers_collections Object_ types for each key
      - that is applied to only the specified header collection(s)
    * a non- _headers_collections Object_ type:
      - that matches one or more particular headers by name to selectively remove
        * _String_
        * _Array&lt;String&gt;_
        * _Object_
          - having the key: 'name'
        * _Array&lt;Object&gt;_
          - each array item having the key: 'name'
      - that is not selective and will result in removal of all previously added headers
        * any other value, for example: _null_
      - that is applied to all of the header collections: ['key', 'manifest', 'audioSegment', 'all']
  - `only_update_last_directive` is:
    * a boolean
    * a truthy value indicates:
      - the provided header names should only be removed from the directive added by the most recent call to: `ResponseBuilder.addAudioPlayerPlayDirective(...)`
    * a non-truthy value indicates:
      - the provided header names should be removed from all directives added by previous calls to: `ResponseBuilder.addAudioPlayerPlayDirective(...)`

#### Details:

* `AddAudioPlayerHttpHeadersRequestInterceptor` can be used without `SetDefaultAudioPlayerHttpHeadersRequestInterceptor`
* `AddAudioPlayerHttpHeadersRequestInterceptor` is required to use `SetDefaultAudioPlayerHttpHeadersRequestInterceptor`
  - and its request interceptor needs to be added first
* `SetDefaultAudioPlayerHttpHeadersRequestInterceptor` is applied to each directive immediately after its being added by a call to: `ResponseBuilder.addAudioPlayerPlayDirective(...)`
  - `ResponseBuilder.removeAudioPlayerHttpHeaders(null, true)` can be called immediately after `ResponseBuilder.addAudioPlayerPlayDirective(...)` to selectively prevent default headers from being included in a particular directive

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [Apache-2.0](https://github.com/warren-bank/Alexa-skill-libraries/raw/master/audio-player-http-request-headers/LICENSE.txt)
  - same as the [Alexa Skills Kit SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/LICENSE)
