import MaintenancePage from '@/components/ui/MaintenancePage';
import { FolderOpen, FileText, Video, Presentation, Download } from 'lucide-react';

export default function FilesPage() {
  return (
    <MaintenancePage
      title="Arquivos"
      subtitle="Em breve"
      description="Esta área reunirá todos os materiais do time: apresentações, PDFs, vídeos, especificações e documentos de referência. Tudo organizado e pesquisável em um só lugar."
      availableDate="Agosto de 2026"
      features={[
        { icon: <FileText className="w-5 h-5 text-brand-500" />, title: 'PDFs e documentos', description: 'Especificações técnicas, briefings e relatórios organizados por formato.' },
        { icon: <Presentation className="w-5 h-5 text-accent-500" />, title: 'Apresentações', description: 'Decks comerciais e materiais de pitch prontos para download.' },
        { icon: <Video className="w-5 h-5 text-success-500" />, title: 'Vídeos de referência', description: 'Demonstrações de formatos e criativos para inspirar campanhas.' },
        { icon: <Download className="w-5 h-5 text-ink-500" />, title: 'Download fácil', description: 'Baixe materiais diretamente ou compartilhe com o time.' },
      ]}
      backLink={{ to: '/', label: 'Voltar ao início' }}
    />
  );
}
