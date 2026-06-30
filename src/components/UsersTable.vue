<template>
  <table>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>

    <tr v-for="u in users" :key="u.id">
      <td>{{ u.name }}</td>
      <td>{{ u.email }}</td>
    </tr>
  </table>
</template>

<script setup>
const users = [
  { id: 1, name: 'Alex', email: 'alex@mail.com' },
  { id: 2, name: 'John', email: 'john@mail.com' }
]
</script>