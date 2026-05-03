import axios from 'axios'

const BASE = 'https://5dzk21vkt0.execute-api.ap-south-1.amazonaws.com/prod'

const api = axios.create({ baseURL: BASE })

// Auth
export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getUser = (userId) =>
  api.get(`/auth/user/${userId}`)

// Inventory
export const getProducts = () =>
  api.get('/inventory')

export const getProduct = (productId) =>
  api.get(`/inventory/${productId}`)

export const addProduct = (data) =>
  api.post('/inventory', data)

export const updateStock = (productId, stock) =>
  api.put(`/inventory/${productId}`, { stock })

// Orders
export const createOrder = (productId, userId, quantity) =>
  api.post('/orders', { productId, userId, quantity })

export const getOrders = () =>
  api.get('/orders')

export const getOrder = (orderId) =>
  api.get(`/orders/${orderId}`)

// Metrics
export const getMetricsOverview = () =>
  api.get('/metrics/overview')

export const getMetricsSQS = () =>
  api.get('/metrics/sqs')

export const getMetricsTraffic = () =>
  api.get('/metrics/traffic')