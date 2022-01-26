import Link from 'next/link'
import Image from 'next/image'
import styles from './header.module.scss'

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/">
          <Image src="/logo.svg" alt="Logo Space Traveling" width="239px" height="26px"/>
        </Link>
      </div>
  </header>
  )
}
