// src/stores/products.js
import { defineStore } from 'pinia'
import { productsService } from '@/services/products.service'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
    factories: [],
    loading: false,
    factoriesLoading: false,
    saving: false,
    deletingId: null,
  }),

  getters: {
    factoryMap(state) {
      return state.factories.reduce((acc, factory) => {
        acc[factory.id] = factory
        return acc
      }, {})
    },

    tableRows(state) {
      return state.products.map(product => ({
        ...product,
        factory_name:
          state.factories.find(f => f.id === product.factory)?.name || '—'
      }))
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const data = await productsService.getProducts()
        this.products = data
      } finally {
        this.loading = false
      }
    },

    async fetchFactories() {
      this.factoriesLoading = true
      try {
        const data = await productsService.getFactories()
        this.factories = data
      } finally {
        this.factoriesLoading = false
      }
    },

    async init() {
      await Promise.all([this.fetchProducts(), this.fetchFactories()])
    },

    async createProduct(payload) {
      this.saving = true
      try {
        const created = await productsService.createProduct(payload)
        this.products.unshift(created)
        return created
      } finally {
        this.saving = false
      }
    },

    async updateProduct(id, payload) {
      this.saving = true
      try {
        const updated = await productsService.updateProduct(id, payload)
        const index = this.products.findIndex(item => item.id === id)
        if (index !== -1) {
          this.products[index] = updated
        }
        return updated
      } finally {
        this.saving = false
      }
    },

    async deleteProduct(id) {
      this.deletingId = id
      try {
        await productsService.deleteProduct(id)
        this.products = this.products.filter(item => item.id !== id)
      } finally {
        this.deletingId = null
      }
    },

    async createFactory(payload) {
      const created = await productsService.createFactory(payload)
      this.factories.push(created)
      return created
    }
  }
})