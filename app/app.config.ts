export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'neutral'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Lexikon-Roman'
  },
  header: {
    title: 'Lexikon-Roman',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: false,
    links: [] as Array<Record<string, unknown>>
  },
  footer: {
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-discord',
      'to': 'https://discord.gg/nsFNP4zZVM',
      'target': '_blank',
      'aria-label': 'Lexikon-Roman on Discord'
    }, {
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/eldarsadykov/lexikon-roman',
      'target': '_blank',
      'aria-label': 'Lexikon-Roman on GitHub'
    }]
  },
  toc: {
    title: '',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nuxt-ui-templates/docs/edit/main/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/nuxt/ui',
        target: '_blank'
      }, {
        icon: 'i-lucide-book-open',
        label: 'Nuxt UI docs',
        to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
        target: '_blank'
      }]
    }
  }
})
