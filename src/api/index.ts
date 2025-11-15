import axios from "axios";

export const api = axios.create({
    baseURL: 'http://192.168.0.14:3333',
});

export const baseUrl = 'http://192.168.0.14:3333';