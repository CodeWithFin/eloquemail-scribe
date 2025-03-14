
import React, { useState } from 'react';
import { Search, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui-custom/Button';
import { useToast } from "@/hooks/use-toast";

const SearchBar = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const isGmailConnected = localStorage.getItem('gmail_token') !== null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    if (isGmailConnected) {
      toast({
        title: "Gmail search",
        description: `Searching Gmail for "${searchQuery}"`,
      });
    } else {
      toast({
        title: "Search performed",
        description: `Searching for "${searchQuery}"`,
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          placeholder={isGmailConnected ? "Search in Gmail..." : "Search emails..."}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-eloquent-400 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </form>
      
      <Link to="/compose">
        <Button
          iconLeft={<PlusCircle size={18} />}
        >
          Compose
        </Button>
      </Link>
    </div>
  );
};

export default SearchBar;
