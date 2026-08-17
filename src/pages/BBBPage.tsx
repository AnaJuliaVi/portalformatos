import MaintenancePage from '@/components/ui/MaintenancePage';
import { Eye, Tv, Star, Film } from 'lucide-react';

export default function BBBPage() {
  return (
    <MaintenancePage
      title="BBB — Big Brother Brasil"
      subtitle="Em breve"
      description="Área exclusiva para materiais, formatos e cases relacionados ao Big Brother Brasil. Aqui você encontrará as oportunidades publicitárias do programa, com especificações, criativos de referência e resultados de campanhas anteriores."
      availableDate="Próxima edição"
      features={[
        { icon: <Eye className="w-5 h-5 text-brand-500" />, title: 'Formatos exclusivos', description: 'Mercados e oportunidades publicitárias únicas do BBB.' },
        { icon: <Tv className="w-5 h-5 text-accent-500" />, title: 'TV + Digital', description: 'Integração entre TV aberta, streaming e plataformas digitais.' },
        { icon: <Star className="w-5 h-5 text-success-500" />, title: 'Cases de sucesso', description: 'Resultados de campanhas que marcaram temporadas anteriores.' },
        { icon: <Film className="w-5 h-5 text-ink-500" />, title: 'Materiais criativos', description: 'Referências visuais e vídeos para inspirar novas campanhas.' },
      ]}
      backLink={{ to: '/', label: 'Voltar ao início' }}
    />
  );
}
