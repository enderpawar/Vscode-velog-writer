#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { parseGitLog } from './lib/git-parser.js';
import { analyzeCommits } from './lib/commit-analyzer.js';
import { generateBlogPost } from './lib/blog-generator.js';
import { saveToBlogFile } from './lib/markdown-composer.js';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

program
  .name('velog-writer')
  .description('Git 커밋으로부터 Velog 블로그 글을 자동 생성')
  .version('1.0.0');

program
  .command('generate')
  .description('오늘의 커밋으로 블로그 글 생성')
  .option('-d, --days <number>', '최근 N일간의 커밋 분석', '1')
  .option('-o, --output <path>', '출력 파일 경로', './blog-post.md')
  .option('--api-key <key>', 'Gemini API 키')
  .option('--repo <path>', 'Git 저장소 경로', process.cwd())
  .action(async (options) => {
    const spinner = ora('Git 커밋 분석 중...').start();

    try {
      // 1. API 키 확인
      const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        spinner.fail('Gemini API 키가 필요해요!');
        console.log(chalk.yellow('\n💡 사용 방법:'));
        console.log(chalk.gray('  1. 환경변수: export GEMINI_API_KEY=your_key'));
        console.log(chalk.gray('  2. 옵션: --api-key your_key\n'));
        process.exit(1);
      }

      // 2. Git 로그 파싱
      spinner.text = 'Git 커밋 분석 중...';
      const commits = await parseGitLog(options.repo, options.days);
      
      if (commits.length === 0) {
        spinner.warn(`최근 ${options.days}일간 커밋이 없어요`);
        process.exit(0);
      }

      console.log(chalk.green(`\n✓ ${commits.length}개 커밋 발견\n`));

      // 3. 커밋 분석
      spinner.text = '커밋 분석 중...';
      const analysis = analyzeCommits(commits);
      
      console.log(chalk.cyan('📊 분석 결과:'));
      console.log(chalk.gray(`  - 파일 변경: ${analysis.filesChanged}개`));
      console.log(chalk.gray(`  - 추가: ${analysis.additions}줄`));
      console.log(chalk.gray(`  - 삭제: ${analysis.deletions}줄`));
      console.log(chalk.gray(`  - 주요 작업: ${analysis.categories.join(', ')}\n`));

      // 4. 블로그 글 생성
      spinner.text = 'Gemini로 블로그 글 생성 중... (30초 정도 걸려요)';
      const blogContent = await generateBlogPost(analysis, apiKey);
      spinner.succeed('블로그 글 생성 완료!');

      // 5. 파일 저장
      const outputPath = await saveToBlogFile(blogContent, options.output);
      
      console.log(chalk.green(`\n✨ 완성! ${outputPath}\n`));
      console.log(chalk.gray('💡 팁: 생성된 글을 검토하고 수정해서 velog에 올려보세요!\n'));

    } catch (error) {
      spinner.fail('오류 발생');
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('커밋 내역 미리보기 (생성 안 함)')
  .option('-d, --days <number>', '최근 N일간의 커밋', '1')
  .option('--repo <path>', 'Git 저장소 경로', process.cwd())
  .action(async (options) => {
    try {
      const commits = await parseGitLog(options.repo, options.days);
      
      if (commits.length === 0) {
        console.log(chalk.yellow(`최근 ${options.days}일간 커밋이 없어요\n`));
        return;
      }

      console.log(chalk.cyan(`\n📝 최근 ${options.days}일간 ${commits.length}개 커밋:\n`));
      
      commits.forEach((commit, i) => {
        console.log(chalk.gray(`${i + 1}. [${commit.hash.slice(0, 7)}] ${commit.message}`));
        console.log(chalk.gray(`   ${commit.author} · ${commit.date}`));
        if (commit.files.length > 0) {
          console.log(chalk.gray(`   파일: ${commit.files.join(', ')}`));
        }
        console.log();
      });

      const analysis = analyzeCommits(commits);
      console.log(chalk.cyan('📊 통계:'));
      console.log(chalk.gray(`  - 파일 변경: ${analysis.filesChanged}개`));
      console.log(chalk.gray(`  - 추가: ${analysis.additions}줄, 삭제: ${analysis.deletions}줄`));
      console.log(chalk.gray(`  - 카테고리: ${analysis.categories.join(', ')}\n`));

    } catch (error) {
      console.error(chalk.red(`\n❌ ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
