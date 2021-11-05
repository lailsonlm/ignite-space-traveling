import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'
import Prismic from '@prismicio/client';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>

        <Header />
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner"/>
        </div>
      <main className={commonStyles.container}>
        <h1>teste</h1>
        {post.first_publication_date}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.author','posts.title', 'posts.subtitle'],
    pageSize: 1,
  });

  return {
    paths: [
      { params: { slug: 'santa-cruz'} }
    ],
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  
  const prismic = getPrismicClient(); 
  const response = await prismic.getByUID('posts', String(context.params.slug), {});
  
  // console.log(context)

  console.log(JSON.stringify(response, null, 2))

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      // content: [{
      //   heading: response.data.content.heanding,
      //   body: [{
      //     text: RichText.asText(response.data.content.body.text),
      //   }],
      // }]
    }
  }

  return {
    props: {
      post,
    },
  }
};
