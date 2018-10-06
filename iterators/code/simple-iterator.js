
function custom(till = 100) {
  let i = 0;
  const iteratorFx = () => {
    console.log('Creating an iterator');
    const iterator = {
      next() {
        i += 1;
        if (i <= till) {
          return { done: false, value: i };
        }
        return { done: true, value: null };
      },
    };
    return iterator;
  };
  return {
    [Symbol.iterator]: iteratorFx,
  };
}


function* generator(till = 100) {
  let i = 1;
  while (i <= till) {
    yield i;
    i += 1;
  }
}

function* mapOver(arr, mapper = (v) => v) {
  for (let i = 0; i < arr.length; i += 1) {
    yield mapper(arr[i]);
  }
}

function print() {
  const genIterable = generator(5);
  for (let num of genIterable) {
    console.log(num);
  }

  const customIterator = custom(5);
  for (let num of customIterator) {
    console.log(num);
  }

  const twices = mapOver([...custom(10)], v => v * 2);
  for (let num of twices) {
    console.log(num);
  }
}

print();
