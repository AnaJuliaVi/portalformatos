import MaintenancePage from '@/components/ui/MaintenancePage';
import { Bell, History, GitBranch, FileEdit } from 'lucide-react';

export default function UpdatesPage() {
  return (
    <MaintenancePage
      title="Atualizações do portal"
      subtitle="Em breve"
      description="Esta seção reunirá o histórico completo de novidades e melhorias do portal: novos formatos adicionados, cases atualizados, mudanças em especificações e ajustes de navegação. Um changelog do time, para o time."
      availableDate="Agosto de 2026"
      features={[
        { icon: <Bell className="w-5 h-5 text-brand-500" />, title: 'Novidades em destaque', description: 'As atualizações mais relevantes no topo, sempre visíveis.' },
        { icon: <History className="w-5 h-5 text-accent-500" />, title: 'Histórico completo', description: 'Linha do tempo com tudo que mudou no portal desde o início.' },
        { icon: <GitBranch className="w-5 h-5 text-success-500" />, title: 'Por categoria', description: 'Filtre por formato, cases, especificações ou navegação.' },
        { icon: <FileEdit className="w-5 h-5 text-ink-500" />, title: 'Notas do time', description: 'Comentários sobre o porquê de cada mudança realizada.' },
      ]}
      backLink={{ to: '/', label: 'Voltar ao início' }}
    />
  );
}
