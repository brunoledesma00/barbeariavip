import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Users, DollarSign, Calendar, Mic, LogOut, Loader2, PlusCircle, X } from 'lucide-react';

// --- 1. CONFIGURAÇÃO DO FIREBASE ---
// As suas chaves de conexão. Verifique se estão corretas.
const firebaseConfig = {
  apiKey: "AIzaSyCpignY3bs1ggK1EC7pMvRrPoHUAIyXQ0Q",
  authDomain: "barbearia-vip-360.firebaseapp.com",
  projectId: "barbearia-vip-360",
  storageBucket: "barbearia-vip-360.appspot.com",
  messagingSenderId: "1089530594833",
  appId: "1:1089530594833:web:9689a74c7e6c73e0a1f1b1"
};

// Inicializar os serviços do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. TELA DE AUTENTICAÇÃO ---
// Componente responsável pelo Login e Cadastro de novos usuários.
const LoginScreen = () => {
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
                case 'auth/user-not-found': setError('Usuário não encontrado.'); break;
                case 'auth/wrong-password': setError('Senha incorreta.'); break;
                case 'auth/email-already-in-use': setError('Este e-mail já está em uso.'); break;
                default: setError('Ocorreu um erro. Tente novamente.');
            }
            console.error("Erro de autenticação:", err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-yellow-400" style={{fontFamily: "'Playfair Display', serif"}}>Barbearia VIP 360°</h1>
                    <p className="text-gray-400">A gestão completa para a sua barbearia.</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">{isSignUp ? 'Criar Nova Conta' : 'Fazer Login'}</h2>
                    <form onSubmit={handleAuth} className="space-y-6">
                        <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"/>
                        <input type="password" placeholder="Sua senha (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"/>
                        <button type="submit" disabled={loading} className="w-full bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center disabled:bg-gray-500">
                            {loading && <Loader2 className="animate-spin mr-2" />}
                            {isSignUp ? 'Cadastrar' : 'Entrar'}
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    <p className="text-center text-gray-400 mt-6">
                        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-yellow-400 font-bold ml-2 hover:underline">
                            {isSignUp ? 'Faça Login' : 'Cadastre-se'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- 3. MÓDULO DE CLIENTES (COM FIREBASE) ---
const ClientsPage = ({ userId }) => {
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '' });
    
    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, "clients"), where("userId", "==", userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsData);
        });
        return () => unsubscribe();
    }, [userId]);

    const handleSaveClient = async () => {
        if (!newClient.name) return alert("O nome do cliente é obrigatório.");
        try {
            await addDoc(collection(db, "clients"), {
                name: newClient.name,
                phone: newClient.phone,
                userId: userId,
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
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md relative">
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h3 className="text-xl font-bold text-yellow-400 mb-6">Adicionar Novo Cliente</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome Completo" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"/>
                        <input type="tel" placeholder="Telefone (Opcional)" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"/>
                        <button onClick={handleSaveClient} className="w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg">Salvar Cliente</button>
                    </div>
                </div>
            </div>
        )}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-yellow-400">Gestão de Clientes ({clients.length})</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusCircle size={18} className="mr-2"/> Novo Cliente
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-600"><tr><th className="p-3">Nome</th><th className="p-3">Telefone</th></tr></thead>
                    <tbody>
                        {clients.length > 0 ? clients.map(client => (
                            <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="p-3 font-semibold text-white">{client.name}</td>
                                <td className="p-3">{client.phone}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="2" className="text-center p-4 text-gray-400">Ainda não há clientes cadastrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </>
    );
};

// --- 4. MÓDULO DE MARKETING (COM GEMINI) ---
const MarketingIA = () => {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic) { setError("Por favor, digite um tema para o post."); return; }
        setIsLoading(true); setResult(''); setError('');
        
        const apiKey = "AIzaSyCpignY3bs1ggK1EC7pMvRrPoHUAIyXQ0Q";
        // CORREÇÃO: Usando o modelo 'gemini-pro', o mais estável e universal.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const payload = { contents: [{ role: "user", parts: [{ text: `Você é um especialista em marketing para redes sociais de barbearias. Crie uma legenda curta e impactante para um post no Instagram com o tema: '${topic}'. Use uma linguagem que conecta com o público masculino, inclua emojis e uma chamada para ação clara para agendamento.` }] }] };
        
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { 
                const errorData = await response.json();
                throw new Error(errorData.error.message || `A API falhou com o status: ${response.status}`);
            }
            const resultData = await response.json();
            if (resultData.candidates && resultData.candidates.length > 0 && resultData.candidates[0].content.parts[0].text) {
                setResult(resultData.candidates[0].content.parts[0].text);
            } else {
                setError("A IA não retornou uma resposta válida. Tente um tópico diferente.");
            }
        } catch (err) { 
            console.error("Gemini API call error:", err);
            setError(`Erro ao conectar com a IA: ${err.message}. Verifique a sua Chave de API.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Assistente de Marketing com IA</h3>
            <div className="space-y-4">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600" placeholder="Ex: Promoção de corte + barba" />
                <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg disabled:bg-gray-500">
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : '✨'}
                    {isLoading ? 'Gerando...' : 'Gerar Legenda'}
                </button>
                {result && <div className="bg-gray-900 p-4 rounded-lg mt-4"><p className="text-white whitespace-pre-wrap">{result}</p></div>}
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
};


// --- 5. APLICAÇÃO PRINCIPAL ---
function MainApp({ user }) {
  const [activeTab, setActiveTab] = useState('clients');

  const handleSignOut = () => {
    signOut(auth);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'clients': return <ClientsPage userId={user.uid} />;
      case 'marketing': return <MarketingIA />;
      default: return <ClientsPage userId={user.uid} />;
    }
  };

  const NavItem = ({ tabName, icon, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${activeTab === tabName ? 'bg-yellow-400 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-700'}`}>
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex">
      <aside className="w-64 bg-gray-800 p-6 flex-shrink-0 flex flex-col">
        <div><h2 className="text-2xl font-bold text-yellow-400 tracking-wider mb-10" style={{fontFamily: "'Playfair Display', serif"}}>VIP 360°</h2></div>
        <nav className="space-y-4 flex-grow">
            <NavItem tabName="clients" icon={<Users size={20} />} label="Clientes" />
            <NavItem tabName="marketing" icon={<Mic size={20} />} label="Marketing IA" />
        </nav>
        <div>
           <button onClick={handleSignOut} className="flex items-center space-x-3 p-3 rounded-lg w-full text-left text-red-400 hover:bg-red-500 hover:text-white">
                <LogOut size={20}/><span>Sair</span>
           </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Bem-vindo, {user.email}</h1>
        {renderContent()}
        <footer className="text-center text-gray-500 mt-10 text-sm">&copy; 2025 Barbearia VIP 360°.</footer>
      </main>
    </div>
  );
}

// --- 6. PONTO DE ENTRADA ---
// Decide se mostra a tela de Login ou a Aplicação principal.
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // CORREÇÃO: Adicionado useEffect para mudar o título da página.
    useEffect(() => {
        document.title = "Barbearia VIP 360°";
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><Loader2 className="text-yellow-400 animate-spin" size={48} /></div>
    }

    return user ? <MainApp user={user} /> : <LoginScreen />;
}
