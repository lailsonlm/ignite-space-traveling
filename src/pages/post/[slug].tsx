import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi"

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';


import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';


interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  },
  preview: boolean;
}

export default function Post({ post, navigation, preview }: PostProps): JSX.Element {
  const router = useRouter()

  if (router.isFallback) {
    return <div className={styles.isFallback}>Carregando...</div>
  }

  

  const totalMinutes = Math.ceil(post.data.content.reduce((acc, cur) => acc + cur.heading  + RichText.asText(cur.body), '')
  .split(/[^a-zA-Z0-9]+/g).length / 200)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = useRef<HTMLDivElement>()

  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const script = document.createElement("script");

    const anchor = ref.current;

    if(anchor.querySelector("div") !== null) {
      anchor.removeChild(anchor.querySelector("div"))
    }
    
    script.src = "https://utteranc.es/client.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.defer = true;
    
    script.setAttribute("repo", "lailsonlm/ignite-space-traveling");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute( "theme", "photon-dark");

    anchor.appendChild(script);
  });
  

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
              {`${totalMinutes} min`}
            </span>
          </div>
        </div>
        <div className={styles.infoEditedPost}>
          {post.last_publication_date ?? post.last_publication_date}
        </div>

        <article className={styles.content}>
          {post.data.content.map(content => {
            return (
              <>
                <h1 key={content.heading}>{content.heading}</h1>
                
                {content.body.map(body => {
                  return (
                    <p key={body.text}>{body.text}</p>
                    
                  )
                })}
              </>
            )
          })}
        </article>
      </main>

      <footer className={styles.footerPost}>
        <div className={styles.postControl}>
          <div className={navigation.prevPost.length !== 0 ? styles.previousPost : styles.noPost}>
            <p>{navigation.prevPost[0]?.data.title ?? ''}</p>
            <Link href={`/post/${navigation.prevPost[0]?.uid ?? ''}`}>
              <a>Post anterior</a>
            </Link>
          </div>

          <div className={navigation.nextPost.length !== 0 ? styles.nextPost : styles.noPost}>
            <p>{navigation.nextPost[0]?.data.title ?? ''}</p>
            <Link href={`/post/${navigation.nextPost[0]?.uid ?? ''}`}>
              Próximo post
            </Link>
          </div>
        </div>

        <div className={styles.comments} ref={ref}> </div>
        
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.exitPreview}>
                Sair do modo Preview
              </a>
            </Link>
          </aside>
        )}
        
      </footer>
    </>
    
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ]);

  
  return {
    paths: posts.results.map((post) => {
      return { params: { slug: post.uid }};
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params, previewData, preview = false }) => {

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  // console.log(context)

  // console.log(JSON.stringify(response, null, 2))

  const nextPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    after: response.id,
    orderings : '[document.first_publication_date desc]'
  });

  const prevPost = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 1,
    after: response.id,
    orderings : '[document.first_publication_date]'
  });


  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: format(
      new Date(response.last_publication_date),
      "'* editado em 'dd MMM yyyy,' às ' HH:mm",
      {
      locale: ptBR,
    }),
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
      navigation: {
        nextPost: nextPost?.results,
        prevPost: prevPost?.results
      },
      preview
    },
  }
};
