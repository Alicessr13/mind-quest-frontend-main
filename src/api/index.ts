import axios from "axios";

export const baseURL = 'http://192.168.0.14:3333';

export const api = axios.create({
    baseURL,
});
