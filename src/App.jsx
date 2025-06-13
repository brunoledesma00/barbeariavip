import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Calendar, Target, Mic, Settings, Package, PlusCircle, X, LogOut, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Em uma aplicação real, estas chaves estariam em variáveis de ambiente.
const firebaseConfig = {
  apiKey: "AIzaSyCpignY3bs1ggK1EC7pMvRrPoHUAIyXQ0Q",
  authDomain: "barbearia-vip-360.firebaseapp.com",
  projectId: "barbearia-vip-360",
  storageBucket: "barbearia-vip-360.appspot.com",
  messagingSenderId: "1089530594833",
  appId: "1:1089530594833:web:9689a74c7e6c73e0a1f1b1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- COMPONENTES DA UI ---

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={24}/>
            </button>
            {children}
        </div>
    </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-gray-800 p-6 rounded-lg flex items-center justify-between shadow-lg">
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
  </div>
);

// --- TELA DE LOGIN ---
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            switch(err.code) {
                case 'auth/user-not-found':
                    setError('Usuário não encontrado. Verifique o e-mail ou cadastre-se.');
                    break;
                case 'auth/wrong-password':
                    setError('Senha incorreta. Por favor, tente novamente.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este e-mail já está em uso. Tente fazer login.');
                    break;
                default:
                    setError('Ocorreu um erro. Por favor, tente novamente.');
                    console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gold">Barbearia VIP 360°</h1>
                    <p className="text-gray-400">Sua barbearia no controle, em qualquer lugar.</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">{isSignUp ? 'Criar Nova Conta' : 'Fazer Login'}</h2>
                    <form onSubmit={handleAuth} className="space-y-6">
                        <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gold"/>
                        <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gold"/>
                        <button type="submit" disabled={loading} className="w-full bg-gold text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500">
                            {loading && <Loader2 className="animate-spin mr-2" />}
                            {isSignUp ? 'Cadastrar' : 'Entrar'}
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    <p className="text-center text-gray-400 mt-6">
                        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-gold font-bold ml-2 hover:underline">
                            {isSignUp ? 'Faça Login' : 'Cadastre-se'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- PÁGINAS DO SISTEMA ---

const Dashboard = ({clients, appointments}) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Faturamento do Mês" value="R$ 5.390" icon={<DollarSign className="text-white"/>} color="bg-green-500" />
            <StatCard title="Total de Clientes" value={clients.length} icon={<Users className="text-white"/>} color="bg-blue-500" />
            <StatCard title="Agendamentos Hoje" value={appointments['Quarta']?.length || 0} icon={<Calendar className="text-white"/>} color="bg-yellow-500" />
            <StatCard title="Ticket Médio" value="R$ 65" icon={<Target className="text-white"/>} color="bg-indigo-500" />
        </div>
        {/* ... restante do dashboard ... */}
    </div>
);

const Clients = ({ clients, userId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '' });

    const handleSaveClient = async () => {
        if (!newClient.name || !newClient.phone) return alert("Preencha nome e telefone.");
        try {
            await addDoc(collection(db, "users", userId, "clients"), {
                ...newClient,
                lastVisit: new Date().toISOString().split('T')[0],
                totalSpent: 0,
            });
            setNewClient({ name: '', phone: '' });
            setIsModalOpen(false);
        } catch (e) {
            console.error("Erro ao adicionar cliente: ", e);
            alert("Falha ao salvar cliente.");
        }
    };
    
    return (
    <>
        {isModalOpen && (
            <Modal onClose={() => setIsModalOpen(false)}>
                <h3 className="text-xl font-bold text-gold mb-6">Adicionar Novo Cliente</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"/>
                    <input type="tel" placeholder="Telefone (WhatsApp)" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"/>
                    <button onClick={handleSaveClient} className="w-full bg-gold text-gray-900 font-bold py-3 px-4 rounded-lg">Salvar Cliente</button>
                </div>
            </Modal>
        )}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gold">Gestão de Clientes</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-gold text-gray-900 font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Novo Cliente
                </button>
            </div>
            {/* ... Tabela de clientes ... */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-600"><tr><th>Nome</th><th>Telefone</th><th>Última Visita</th><th>Total Gasto</th></tr></thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="p-3 font-semibold text-white">{client.name}</td>
                                <td className="p-3">{client.phone}</td>
                                <td className="p-3">{client.lastVisit}</td>
                                <td className="p-3 text-green-400">R$ {client.totalSpent.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </>
    );
};
// ... outros componentes (Schedule, Inventory, etc.) com lógica de Firestore similar ...

// --- GEMINI API INTEGRATION ---
async function callGemini(prompt) {
  const apiKey = "AIzaSyCpignY3bs1ggK1EC7pMvRrPoHUAIyXQ0Q";
  // CORREÇÃO: Usando o modelo de IA gemini-pro, que é estável e amplamente disponível.
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { 
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error?.message || `API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates.length > 0) {
        return result.candidates[0].content.parts[0].text;
    } else {
        return "A IA não retornou uma resposta. Tente um tópico diferente.";
    }
  } catch (error) { 
    console.error("Gemini API call error:", error);
    return `Erro ao conectar com a IA: ${error.message}. Verifique a chave de API e o nome do modelo.` 
  }
}

const MarketingIA = () => {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!topic) { setResult("Por favor, digite um tema para o post."); return; }
        setIsLoading(true); setResult('');
        const prompt = `Você é um especialista em marketing para redes sociais de barbearias. Crie uma legenda curta e impactante para um post no Instagram com o tema: '${topic}'. Use uma linguagem que conecta com o público masculino, inclua emojis e uma chamada para ação clara para agendamento.`;
        const generatedText = await callGemini(prompt);
        setResult(generatedText); setIsLoading(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gold mb-4">Assistente de Marketing com IA</h3>
            <p className="text-gray-400 mb-4">Sem ideias para posts? Descreva o tema e deixe nossa IA criar uma legenda profissional para você.</p>
            <div className="space-y-4">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600" placeholder="Ex: Promoção de Dia dos Pais, novo corte, etc." />
                <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-gold text-gray-900 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500">
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : '✨'}
                    {isLoading ? 'Gerando...' : 'Gerar Legenda'}
                </button>
                {result && (
                    <div className="bg-gray-900 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold text-gold mb-2">Sugestão de Legenda:</h4>
                        <p className="text-white whitespace-pre-wrap">{result}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---
function MainApp({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState(initialAppointments); // Simulado por enquanto
  const [inventory, setInventory] = useState([]); // Simulado por enquanto

  useEffect(() => {
      if (!user) return;
      
      const clientsQuery = query(collection(db, "users", user.uid, "clients"));
      const unsubscribeClients = onSnapshot(clientsQuery, (querySnapshot) => {
          const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClients(clientsData);
      });

      // Adicionar aqui listeners para 'appointments' e 'inventory' da mesma forma
      
      return () => {
          unsubscribeClients();
          // unsubscribeAppointments();
          // unsubscribeInventory();
      };
  }, [user]);
  
  const handleSignOut = () => {
    signOut(auth);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={clients} appointments={appointments} />;
      case 'clients': return <Clients clients={clients} userId={user.uid} />;
      case 'marketing': return <MarketingIA />;
      // ... outras abas aqui ...
      default: return <Dashboard clients={clients} appointments={appointments}/>;
    }
  };

  const NavItem = ({ tabName, icon, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === tabName ? 'bg-gold text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-700'}`}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex">
      <aside className="w-64 bg-gray-800 p-6 flex-shrink-0 flex flex-col">
        <div className="flex items-center space-x-2 mb-10"><span className="text-2xl font-bold text-gold tracking-wider">VIP 360°</span></div>
        <nav className="space-y-4 flex-grow">
            <NavItem tabName="dashboard" icon={<DollarSign size={20} />} label="Visão Geral" />
            <NavItem tabName="schedule" icon={<Calendar size={20} />} label="Agenda" />
            <NavItem tabName="clients" icon={<Users size={20} />} label="Clientes" />
            <NavItem tabName="inventory" icon={<Package size={20} />} label="Estoque" />
            <NavItem tabName="marketing" icon={<Mic size={20} />} label="Marketing IA" />
        </nav>
        <div>
           <button onClick={handleSignOut} className="flex items-center space-x-3 p-3 rounded-lg w-full text-left text-red-400 hover:bg-red-500 hover:text-white">
                <LogOut size={20}/><span>Sair</span>
           </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Olá!</h1>
        <p className="text-gray-400 mb-8">{user.email}</p>
        {renderContent()}
        <footer className="text-center text-gray-500 mt-10 text-sm">&copy; 2025 Barbearia VIP 360°. Todos os direitos reservados.</footer>
      </main>
    </div>
  );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe(); // Cleanup subscription
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><Loader2 className="text-gold animate-spin" size={48} /></div>
    }

    return user ? <MainApp user={user} /> : <Login />;
}
