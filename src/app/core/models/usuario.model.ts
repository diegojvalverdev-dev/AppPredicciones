export interface LoginResponse {
  token: string;
  respuesta: {
    id: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Usuario {
  id: number;
  username?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  rol?: string;
  [key: string]: any;
}
