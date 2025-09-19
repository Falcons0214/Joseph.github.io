import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      {/* <HomepageHeader /> */}
      <main>
        <div className="container">
        <img src="/Joseph.github.io/img/background.jpg" alt="Description of the image"/>
          <blockquote cite="https://datatracker.ietf.org/doc/html/rfc1149">
          <p className="main-heading">You need to recognize reality to escape from it.</p>
          </blockquote>
          <div>
            <h1 className='self-intro-head'>關於我</h1>
            <p> 一位工程師，熟悉 Operating System 與各式嵌入式開發技能 (C、Link-script、Assembly、GNU extensions)。</p>
            <p> 曾經是一位鐵人三項運動員，至今仍保持穩定的運動習慣。 </p>
            <p> 原本是一位不喜歡拍照與記錄的靈魂，在發現那些隨著時間被沖刷掉的感受後，希望能夠以此，讓自己回顧時，想起當時的感覺。 </p>
            <p> 自幹了一顆 RV32I Five Pipeline CPU。 </p>
            <p> 喜歡與朋友小酌、聊天、散步，嘗試新鮮事物，躺在床上耍廢。</p>
            <p> 期許自己能夠腳踏實地的活著，與成為一位有故事的人。 </p>
            <p> 我是圖中中間那位。 </p>
          </div>
        </div>

      </main>
    </Layout>
  );
}