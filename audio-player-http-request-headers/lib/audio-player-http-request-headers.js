const AddAudioPlayerHttpHeadersRequestInterceptor = {
  process(handlerInput) {

    // -------------------------------------------------------------------------
    // add API: addAudioPlayerHttpHeaders
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.addAudioPlayerHttpHeaders = (headers, allow_delete) => {
      const response = handlerInput.responseBuilder.getResponse()
      const is_valid = (headers && Array.isArray(headers) && headers.length)

      if (response.directives) {
        response.directives.forEach(directive => {
          if (directive.type === 'AudioPlayer.Play') {
            if (is_valid) {
              if (!directive.audioItem.stream.httpHeaders)
                directive.audioItem.stream.httpHeaders = {}

              if (!directive.audioItem.stream.httpHeaders.all)
                directive.audioItem.stream.httpHeaders.all = []

              if (directive.audioItem.stream.httpHeaders.all.length) {
                directive.audioItem.stream.httpHeaders.all = directive.audioItem.stream.httpHeaders.all.filter(old_header => {
                  return !headers.find(new_header => (new_header.name === old_header.name))
                })
              }

              directive.audioItem.stream.httpHeaders.all = [
                ...directive.audioItem.stream.httpHeaders.all,
                ...headers
              ]
            }
            else if (allow_delete) {
              delete directive.audioItem.stream.httpHeaders
            }
          }
        })
      }

      return handlerInput.responseBuilder
    }

    // -------------------------------------------------------------------------
    // add API: removeAudioPlayerHttpHeaders
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.removeAudioPlayerHttpHeaders = () => {
      return handlerInput.responseBuilder.addAudioPlayerHttpHeaders(null, true)
    }

  }
}

const SetDefaultAudioPlayerHttpHeadersRequestInterceptor = (headers) => ({
  process(handlerInput) {

    if (typeof handlerInput.responseBuilder.addAudioPlayerHttpHeaders !== 'function') {
      console.log('Error: AddAudioPlayerHttpHeadersRequestInterceptor must be added BEFORE SetDefaultAudioPlayerHttpHeadersRequestInterceptor')
      return
    }

    if (!(headers && Array.isArray(headers) && headers.length))
      return

    const addAudioPlayerPlayDirective = handlerInput.responseBuilder.addAudioPlayerPlayDirective

    // -------------------------------------------------------------------------
    // monkey-patch API: addAudioPlayerPlayDirective
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.addAudioPlayerPlayDirective = (...args) => {
      addAudioPlayerPlayDirective.apply(handlerInput.responseBuilder, args)

      return handlerInput.responseBuilder.addAudioPlayerHttpHeaders(headers)
    }

  }
})

module.exports = {AddAudioPlayerHttpHeadersRequestInterceptor, SetDefaultAudioPlayerHttpHeadersRequestInterceptor}
