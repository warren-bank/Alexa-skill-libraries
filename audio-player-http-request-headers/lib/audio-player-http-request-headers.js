// https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/audioplayer.html#play
const valid_headers_collections = ['key', 'manifest', 'audioSegment', 'all']

// -----------------------------------------------------------------------------
// helpers for general use

const normalize_headers = (headers) => {
  const normalized_headers = []

  if (headers && Array.isArray(headers) && headers.length) {
    headers.forEach(header => {
      if (header && (header instanceof Object) && header.name)
        normalized_headers.push(header)
    })
  }

  return normalized_headers
}

const normalize_headers_collections = (headers_collections) => {
  const normalized_headers_collections = {}
  let headers

  if (headers_collections) {
    if (Array.isArray(headers_collections)) {
      headers = normalize_headers(headers_collections)

      if (headers.length)
        normalized_headers_collections["all"] = headers
    }
    else if (headers_collections instanceof Object) {
      for (let key in headers_collections) {
        if (valid_headers_collections.indexOf(key) >= 0) {
          headers = normalize_headers(headers_collections[key])

          if (headers.length)
            normalized_headers_collections[key] = headers
        }
      }
    }
  }

  return Object.keys(normalized_headers_collections).length
    ? normalized_headers_collections
    : null
}

// -----------------------------------------------------------------------------
// helpers for adding headers

const add_headers_collection_to_play_directive = (directive, headers_collection, headers, allow_delete) => {
  if (valid_headers_collections.indexOf(headers_collection) === -1)
    return

  if (directive.type === 'AudioPlayer.Play') {
    if (headers && Array.isArray(headers) && headers.length) {
      if (!directive.audioItem.stream.httpHeaders)
        directive.audioItem.stream.httpHeaders = {}

      if (!directive.audioItem.stream.httpHeaders[headers_collection])
        directive.audioItem.stream.httpHeaders[headers_collection] = []

      // remove old headers with names that match new headers
      if (directive.audioItem.stream.httpHeaders[headers_collection].length) {
        directive.audioItem.stream.httpHeaders[headers_collection] = directive.audioItem.stream.httpHeaders[headers_collection].filter(old_header => {
          return !headers.find(new_header => (new_header.name === old_header.name))
        })
      }

      // conditionally, remove new headers with an empty value
      if (allow_delete) {
        headers = headers.filter(new_header => !!new_header.value)
      }

      directive.audioItem.stream.httpHeaders[headers_collection] = [
        ...directive.audioItem.stream.httpHeaders[headers_collection],
        ...headers
      ]
    }
    else if (allow_delete) {
      delete directive.audioItem.stream.httpHeaders[headers_collection]
    }
  }
}

const add_headers_collections_to_play_directive = (directive, headers_collections, allow_delete) => {
  if (!allow_delete)
    headers_collections = normalize_headers_collections(headers_collections)

  if (headers_collections) {
    for (let headers_collection in headers_collections) {
      add_headers_collection_to_play_directive(directive, headers_collection, headers_collections[headers_collection], allow_delete)
    }
  }
}

// -----------------------------------------------------------------------------
// helpers for removing headers

const get_headers_to_delete = (header_names) => {
  let headers = header_names

  if (!headers)
    headers = ''

  if ((headers instanceof Object) && headers.name)
    headers = headers.name

  if (typeof headers === 'string')
    headers = [headers]

  if (!Array.isArray(headers))
    headers = ['']

  headers = headers.map(header => ((header instanceof Object) && header.name) ? header.name : header)
  headers = headers.filter(name => ((typeof name === 'string') && !!name))
  headers = headers.map(name => ({"name": name, "value": ''}))

  return headers
}

const get_headers_collections_to_delete = (header_names) => {
  const headers_collections = {}
  let has_headers_collections = false
  let headers

  if (header_names && (header_names instanceof Object)) {
    for (let key in header_names) {
      if (valid_headers_collections.indexOf(key) >= 0) {
        headers = get_headers_to_delete(header_names[key])

        headers_collections[key] = headers
        has_headers_collections  = true
      }
    }
  }

  if (!has_headers_collections) {
    headers = get_headers_to_delete(header_names)

    for (let headers_collection of valid_headers_collections) {
      headers_collections[headers_collection] = headers
    }
  }

  return headers_collections
}

// -----------------------------------------------------------------------------

const AddAudioPlayerHttpHeadersRequestInterceptor = {
  process(handlerInput) {

    // -------------------------------------------------------------------------
    // add API: addAudioPlayerHttpHeaders
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.addAudioPlayerHttpHeaders = (headers_collections, only_update_last_directive, allow_delete) => {
      const response = handlerInput.responseBuilder.getResponse()

      if (response && response.directives && Array.isArray(response.directives) && response.directives.length) {
        for (let i = (response.directives.length - 1); i >= 0; i--) {
          const directive = response.directives[i]

          add_headers_collections_to_play_directive(directive, headers_collections, allow_delete)

          if (only_update_last_directive && (directive.type === 'AudioPlayer.Play'))
            break
        }
      }

      return handlerInput.responseBuilder
    }

    // -------------------------------------------------------------------------
    // add API: removeAudioPlayerHttpHeaders
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.removeAudioPlayerHttpHeaders = (header_names, only_update_last_directive) => {
      const headers_collections = get_headers_collections_to_delete(header_names)

      return handlerInput.responseBuilder.addAudioPlayerHttpHeaders(
        headers_collections,
        only_update_last_directive,
        /* allow_delete= */ true
      )
    }

  }
}

const SetDefaultAudioPlayerHttpHeadersRequestInterceptor = (headers_collections) => ({
  process(handlerInput) {

    if (typeof handlerInput.responseBuilder.addAudioPlayerHttpHeaders !== 'function') {
      console.log('Error: AddAudioPlayerHttpHeadersRequestInterceptor must be added BEFORE SetDefaultAudioPlayerHttpHeadersRequestInterceptor')
      return
    }

    headers_collections = normalize_headers_collections(headers_collections)

    if (!headers_collections)
      return

    const addAudioPlayerPlayDirective = handlerInput.responseBuilder.addAudioPlayerPlayDirective

    // -------------------------------------------------------------------------
    // monkey-patch API: addAudioPlayerPlayDirective
    // -------------------------------------------------------------------------
    handlerInput.responseBuilder.addAudioPlayerPlayDirective = (...args) => {
      addAudioPlayerPlayDirective.apply(handlerInput.responseBuilder, args)

      return handlerInput.responseBuilder.addAudioPlayerHttpHeaders(
        headers_collections,
        /* only_update_last_directive= */ true,
        /* allow_delete= */ false
      )
    }

  }
})

module.exports = {AddAudioPlayerHttpHeadersRequestInterceptor, SetDefaultAudioPlayerHttpHeadersRequestInterceptor}
