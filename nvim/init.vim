let mapleader =" "
" Use System Clipboard
set clipboard+=unnamedplus

" Go to center on insert
autocmd InsertEnter * norm zz

" Remove trailing whitespace on save
autocmd BufWritePre * %s/\s\+$//e

" Shortcutting split navigation
map <C-h> <C-w>h
map <C-j> <C-w>j
map <C-k> <C-w>k
map <C-l> <C-w>l

" Shortcutting split opening
nnoremap <leader>h :split<Space>
nnoremap <leader>v :vsplit<Space>

" Alias reaplce all to S
nnoremap S :%s//gI<Left><Left><Left>

" Plugins
call plug#begin("~/.vim/plugged")
Plug 'tomasiser/vim-code-dark'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'

Plug 'pangloss/vim-javascript'    " JavaScript support
Plug 'peitalin/vim-jsx-typescript' " TSX Support
Plug 'leafgarland/typescript-vim' " TypeScript syntax
Plug 'maxmellon/vim-jsx-pretty'   " JS and JSX syntax
Plug 'neoclide/coc.nvim' , { 'branch' : 'release' }
call plug#end()

" Basic Settings
set mouse=a
syntax on
set ignorecase
set smartcase
set number relativenumber
set termguicolors
set t_Co=256
set t_ut=
colorscheme codedark

" Tab Settings
set expandtab
set shiftwidth=2
set softtabstop=2
set tabstop=2

set cursorline
highlight CursorLine ctermbg=Yellow cterm=bold guibg=#2b2b2b
" Autocompletion
set wildmode=longest,list,full

" Fix Splitting
set splitbelow splitright

" Airline
let g:airline_theme = 'codedark'
let g:airline#extensions#tabline#enabled = 1
let g:airline#extensions#tabline#left_sep = ' '
let g:airline#extensions#tabline#left_alt_sep = '|'

" Tabs
nnoremap <C-t>     :tabnew<CR>
inoremap <C-t>     <Esc>:tabnew<CR>
nnoremap <C-j> gT
nnoremap <C-k> gt

" COC Tab autocomplete
inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()
inoremap <expr><S-TAB> pumvisible() ? "\<C-p>" : "\<C-h>"

function! s:check_back_space() abort
  let col = col('.') - 1
  return !col || getline('.')[col - 1]  =~# '\s'
endfunction

if has('nvim')
  inoremap <silent><expr> <c-space> coc#refresh()
else
  inoremap <silent><expr> <c-@> coc#refresh()
endif

" Use <cr> to confirm completion, `<C-g>u` means break undo chain at current
" position. Coc only does snippet and additional edit on confirm.
" <cr> could be remapped by other vim plugin, try `:verbose imap <CR>`.
if exists('*complete_info')
  inoremap <expr> <cr> complete_info()["selected"] != "-1" ? "\<C-y>" : "\<C-g>u\<CR>"
else
  inoremap <expr> <cr> pumvisible() ? "\<C-y>" : "\<C-g>u\<CR>"
endif

" Use K to show documentation in preview window
nnoremap <silent> K :call <SID>show_documentation()<CR>

function! s:show_documentation()
  if (index(['vim','help'], &filetype) >= 0)
    execute 'h '.expand('<cword>')
  else
    call CocAction('doHover')
  endif
endfunction
