export interface SCollection {
  name?: string
  id?: string
  auth?: SAuth
  variables?: SProperties[]
  prerequest?: string
  tests?: string
  items?: SItem[]
}

export interface SProperties {
  key?: string
  value?: string
  type?: string
}

export interface SAuth {
  type?: string
  basic?: SProperties[]
}

export interface SItem {
  name?: string
  description?: string
  body?: string
  url?: string
  headers?: SProperties[]
  method?: string
  items?: SItem[]
  prerequest?: string
  tests?: string
  auth?: SAuth
}



