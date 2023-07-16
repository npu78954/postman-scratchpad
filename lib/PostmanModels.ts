export type PCollection = {
  info?: PInfo
  item?: PItem[]
  auth?: PAuth
  event?: PEvent[]
  variable?: PProperties[]
}
export interface PAuth {
  type?: string
  basic?: PProperties[]
}

export interface PUrl {
  raw?: string
  host?: string[]
  path?: string[]
}
export interface PProperties {
  key?: string
  value?: string
  type?: string
}
export interface PItem {
  name?: string
  item?: PItem[]
  event?: PEvent[]
  protocolProfileBehavior?: {
    disableUrlEncoding?: boolean
  }
  request?: PRequest
}
export interface PRequest {
  method?: string
  header?: PProperties[]
  body?: PBody
  url?: PUrl
  description?: string
}
export interface PBody {
  mode?: string
  raw?: string
  options?: {
    raw?: {
      language?: string
    }
  }
}
export interface PInfo {
  _postman_id?: string
  name?: string
  schema?: string
}
export interface PEvent {

    listen?: string
    script?: {
      exec?: string[]
      type?: string
    }
}

