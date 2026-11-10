export const MATERIAIS_INICIAIS = [
  {
    id: '1',
    nome: 'Cimento CP 50kg',
    descricao: 'Saco de cimento Portland composto',
    codigo: 'CMN001',
    estoque: 120,
    unidade: 'un (sacos 50kg)',
    estoqueMinimo: 30,
    status: 'Em estoque',
    tipoStatus: 'success', // verde
    categoria: 'Alvenaria / Cimento',
    localizacao: 'Galpão A - Palete 04',
    fornecedor: 'Votorantim Cimentos',
    precoUnitario: 'R$ 38,50',
    valorTotalEstoque: 'R$ 4.620,00',
    detalhes: 'Cimento Portland CP II-Z-32 de alta resistência inicial e excelente trabalhabilidade, indicado para fundações, estruturas de concreto armado, argamassas de assentamento e revestimentos em geral.',
    tipoIcone: 'cement'
  },
  {
    id: '2',
    nome: 'Vergalhão CA-50 10mm',
    descricao: 'Barra de aço nervurada',
    codigo: 'VER010',
    estoque: 59,
    unidade: 'un (barras 12m)',
    estoqueMinimo: 60,
    status: 'Estoque baixo',
    tipoStatus: 'warning', // amarelo/laranja
    categoria: 'Estrutural / Aço',
    localizacao: 'Pátio Aberto - Baia B2',
    fornecedor: 'Gerdau Aços Brasil',
    precoUnitario: 'R$ 54,90',
    valorTotalEstoque: 'R$ 3.239,10',
    detalhes: 'Barra de aço CA-50 nervurada com diâmetro nominal de 10.0mm (3/8") e comprimento de 12 metros. Alta aderência ao concreto e excelente soldabilidade para armaduras estruturais.',
    tipoIcone: 'steel'
  },
  {
    id: '3',
    nome: 'Tinta Acrílica Branco 18L',
    descricao: 'Tinta acrílica fosca para paredes',
    codigo: 'TIN018',
    estoque: 20,
    unidade: 'un (latas 18L)',
    estoqueMinimo: 25,
    status: 'Em falta',
    tipoStatus: 'danger', // vermelho
    categoria: 'Acabamento / Pintura',
    localizacao: 'Galpão B - Prateleira 03',
    fornecedor: 'Suvinil Tintas',
    precoUnitario: 'R$ 289,00',
    valorTotalEstoque: 'R$ 5.780,00',
    detalhes: 'Tinta acrílica premium acabamento fosco na cor Branco Neve. Rendimento de até 150m² por demão, altamente resistente a intempéries e mofo, recomendada para interiores e exteriores.',
    tipoIcone: 'paint'
  }
];
