import axios from "axios";

export const api = axios.create({
    baseURL: 'http://10.98.68.106:3333',
});
