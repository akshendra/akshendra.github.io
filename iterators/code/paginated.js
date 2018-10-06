/**
 * Will read paginated api
 */

const axios = require('axios');

async function* fetch() {
  let page = 1;
  while (true) {
    const api = `https://reqres.in/api/users?page=${page}`;
    const response = await axios.get(api);
    yield response.data;
    page += 1;
  }
}

async function print(n = 10) {
  let read = 1;
  for await (const users of fetch()) {
    console.log(users);
    read += 1;
    if (read === n) {
      break;
    }
  }
}

print().then(() => console.log('Done.')).catch(console.error);