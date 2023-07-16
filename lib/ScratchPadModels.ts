export interface SCollection {
  name?: string
  id?: string
  auth?: SAuth
  variables?: SProperties[]
  prerequest?: string
  tests?: string
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
