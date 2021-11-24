import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi"

import { useRouter } from 'next/router';
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
  const router = useRouter()

  if (router.isFallback) {
    return <div className={styles.isFallback}>Carregando...</div>
  }

  const allContent = Math.ceil(post.data.content.reduce((acc, cur) => acc + cur.heading  + RichText.asText(cur.body), '').split(/[^a-zA-Z0-9]+/g).length / 200)

  const totalMinutes = `${allContent} min`


  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={styles.info}>
          <div className={styles.createdAt}>
            <FiCalendar />
            <span>
              {format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                locale: ptBR,
              })}
            </span>
          </div>
          <div className={styles.author}>
            <FiUser />
            <span>
              {post.data.author}
            </span>
          </div>
          <div className={styles.readingTime}>
            <FiClock />
            <span>
              {totalMinutes}
            </span>
          </div>
        </div>
        <article className={styles.content}>
          {post.data.content.map(content => {
            return (
              <>
                <h1 key={content.heading}>{content.heading}</h1>
                
                {content.body.map(body => {
                  return (
                    <p>{body.text}</p>
                    
                  )
                })}
              </>
            )
          })}

        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
    pageSize: 100,
  });
  
  return {
    paths: posts.results.map((post) => {
      return { params: { slug: post.uid }};
    }),
    fallback: true,
  };


};

export const getStaticProps: GetStaticProps = async context => {

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(context.params.slug), {});

  // console.log(context)

  // console.log(JSON.stringify(response, null, 2))

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    }
  }


  return {
    props: {
      post,
    },
  }
};
