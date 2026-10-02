import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
        />
        <meta name="theme-color" content="#0B6FBE" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
