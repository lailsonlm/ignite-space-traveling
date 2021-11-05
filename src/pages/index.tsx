import { GetStaticProps } from 'next';
import { useState } from 'react';
import Head from 'next/head'
import Link from 'next/link'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from "react-icons/fi"
import Prismic from '@prismicio/client'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}


export default function Home({ postsPagination }: HomeProps): JSX.Element {

  const { results } = postsPagination
  const [next_page, setNextPage]  = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState<Post[]>(results)

  function loadPosts(): void {
    fetch(`${next_page}`)
      .then((response) => response.json())
      .then(data => {
        setCurrentPage((prevState) => [...prevState, ...data.results])
        setNextPage(data.next_page)
    }) 
  }
  
  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>
      <main className={styles.container}>
        <img src="/images/logo.svg" alt="logo" className={styles.logo} />

        {currentPage.map(post => (
          <section className={styles.contentContainer} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div className={styles.createdAt}>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                    
                  </div>
                  <div className={styles.author}>
                    <FiUser />
                    {post.data.author}
                  </div>
                </div>
              </a>
            </Link>
            
          </section>
        ))}

        {next_page ?
          <button
            type="button"
            onClick={loadPosts}
            className={styles.morePosts}
          >
            Carregar mais posts
          </button>
          : ''
        }

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.author','posts.title', 'posts.subtitle'],
    pageSize: 1,
  });

  // console.log(JSON.stringify(postsResponse, null, 2))

  const { next_page } = postsResponse

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  })

  return {
    props: {
      postsPagination: {
        next_page,
        results
      }
    },
    revalidate: 60, // 1 minuto
  }

};
