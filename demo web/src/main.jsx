import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/*
|--------------------------------------------------------------------------
| PL QUICKY MOBILE API FIX
|--------------------------------------------------------------------------
|
| On the computer:
|   localhost:5000
|
| On a phone/tablet:
|   automatically use the same hostname that opened the frontend.
|
| Example:
|
|   PC:
|   http://localhost:5173
|       ↓
|   http://localhost:5000
|
|   Phone:
|   http://192.168.1.10:5173
|       ↓
|   http://192.168.1.10:5000
|
|--------------------------------------------------------------------------
*/

const getApiHost = () => {
  const hostname = window.location.hostname;

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return 'http://localhost:5000';
  }

  return `http://${hostname}:5000`;
};

const API_HOST = getApiHost();

console.log('PL QUICKY API HOST:', API_HOST);


/*
|--------------------------------------------------------------------------
| GLOBAL FETCH PATCH
|--------------------------------------------------------------------------
|
| This automatically fixes ALL existing frontend requests such as:
|
| http://localhost:5000/api/standings
| http://localhost:5000/api/fixtures/saved
| http://localhost:5000/api/teams
| http://localhost:5000/api/...
|
| when the application is opened from a phone.
|
|--------------------------------------------------------------------------
*/

const originalFetch = window.fetch.bind(window);

window.fetch = (input, init) => {

  try {

    if (typeof input === 'string') {

      if (
        input.startsWith('http://localhost:5000') ||
        input.startsWith('http://127.0.0.1:5000')
      ) {

        const fixedUrl = input
          .replace(
            'http://localhost:5000',
            API_HOST
          )
          .replace(
            'http://127.0.0.1:5000',
            API_HOST
          );

        console.log(
          'API request:',
          fixedUrl
        );

        return originalFetch(
          fixedUrl,
          init
        );
      }

    }


    /*
    |--------------------------------------------------------------------------
    | Handle Request objects too
    |--------------------------------------------------------------------------
    */

    if (
      typeof Request !== 'undefined' &&
      input instanceof Request
    ) {

      const originalUrl = input.url;

      if (
        originalUrl.includes(
          'localhost:5000'
        ) ||
        originalUrl.includes(
          '127.0.0.1:5000'
        )
      ) {

        const fixedUrl = originalUrl
          .replace(
            'http://localhost:5000',
            API_HOST
          )
          .replace(
            'http://127.0.0.1:5000',
            API_HOST
          );

        console.log(
          'API Request object:',
          fixedUrl
        );

        return originalFetch(
          new Request(
            fixedUrl,
            input
          ),
          init
        );
      }

    }

  } catch (error) {

    console.error(
      'API URL rewrite error:',
      error
    );

  }


  return originalFetch(
    input,
    init
  );
};


/*
|--------------------------------------------------------------------------
| START REACT
|--------------------------------------------------------------------------
*/

ReactDOM.createRoot(
  document.getElementById('root')
).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);